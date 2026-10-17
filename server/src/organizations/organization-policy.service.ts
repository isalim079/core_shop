import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthStore } from '../auth/auth-store.service';
import { Prisma } from '../generated/prisma/client';
import { DomainError } from '../common/errors/domain-error';
import { Principal } from '../common/guards/access';
import { TenantAuthorization, TenantScope } from '../common/guards/tenant-authorization';
import { CommandService } from '../common/commands/command.service';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto, decodeCursor, encodeCursor } from '../common/pagination/pagination.dto';
import { AccessAssignmentDto } from './organization.dto';

export type Tx = Prisma.TransactionClient;
export const organizationSelect = { id: true, name: true, status: true, currency: true, currencyScale: true, timezone: true, quantityScale: true,
  allowNegativeStock: true, address: true, documentLanguage: true, createdAt: true, updatedAt: true, branding: { select: { logoFileId: true, coverFileId: true } } } as const;
export const branchSelect = { id: true, organizationId: true, code: true, name: true, address: true, archivedAt: true, createdAt: true, updatedAt: true } as const;
export const memberInclude = { roles: { include: { role: { include: { permissions: true } } } }, branches: true } as const;
export const controlPermissions = new Set(['STAFF_MANAGE', 'ORG_UPDATE', 'BRANCH_MANAGE', 'BILLING_MANAGE']);
export const jsonObject = (value: object): Prisma.InputJsonObject => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;

export function pageWhere(query: PaginationQueryDto) {
  if (!query.cursor) return {};
  const { createdAt, id } = decodeCursor(query.cursor);
  const date = new Date(createdAt);
  return { OR: [{ createdAt: query.direction === 'asc' ? { gt: date } : { lt: date } }, { createdAt: date, id: query.direction === 'asc' ? { gt: id } : { lt: id } }] };
}
export function page<T extends { id: string; createdAt: Date }>(rows: T[], query: PaginationQueryDto) {
  const hasMore = rows.length > query.limit;
  const items = rows.slice(0, query.limit);
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? encodeCursor({ v: 1, id: last.id, createdAt: last.createdAt.toISOString() }) : null };
}

@Injectable()
export class OrganizationPolicy {
  constructor(private readonly database: DatabaseService, readonly auth: AuthStore, private readonly authorization: TenantAuthorization,
    readonly commands: CommandService, readonly audit: AuditService) {}
  get db() {
    if (!this.database.client) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    return this.database.client;
  }
  read<T>(scope: TenantScope, run: (tx: Tx, current: TenantScope) => Promise<T>) {
    this.authorization.assertIssued(scope);
    return this.db.$transaction(async (tx) => run(tx, await this.authorization.revalidate(scope, tx)), { maxWait: 3000, timeout: 10_000 });
  }
  async write(scope: TenantScope, principal: Principal, key: string, requestId: string, operation: string, payload: unknown,
    run: (tx: Tx, current: TenantScope, commandId: string) => Promise<{ body: object; entityId?: string }>, action: string, entityType: string, statusCode = 200) {
    if (scope.actorId !== principal.userId) throw new DomainError('FORBIDDEN', 403);
    try {
      const result = await this.commands.execute(scope, { operation, key, requestId, payload: jsonObject(payload as object), serializeOrganization: true }, async (tx, current, commandId) => {
        await this.auth.requireSession(tx, principal.userId, principal.credentialId);
        const result = await run(tx, current, commandId);
        await this.audit.append(tx, current, { requestId, action, entityType, entityId: result.entityId, metadata: { commandId } });
        return { statusCode, body: jsonObject(result.body) };
      });
      return result.body;
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw new DomainError('CONFLICT', 409);
      throw error;
    }
  }
  async actor(tx: Tx, scope: TenantScope) {
    const actor = await tx.membership.findFirst({ where: { id: scope.membershipId, organizationId: scope.organizationId, userId: scope.actorId, status: 'ACTIVE' }, include: memberInclude });
    if (!actor) throw new DomainError('FORBIDDEN', 403);
    return actor;
  }
  async owner(tx: Tx, scope: TenantScope) {
    const actor = await this.actor(tx, scope);
    if (!actor.isOwner) throw new DomainError('FORBIDDEN', 403);
    return actor;
  }
  permissions(member: Awaited<ReturnType<OrganizationPolicy['actor']>>) {
    return new Set(member.roles.filter(({ role }) => !role.archivedAt).flatMap(({ role }) => role.permissions.map((p) => p.permissionCode)));
  }
  async validateAssignment(tx: Tx, organizationId: string, assignment: AccessAssignmentDto) {
    const roles = await tx.role.findMany({ where: { organizationId, id: { in: assignment.roleIds }, archivedAt: null }, include: { permissions: true } });
    if (roles.length !== assignment.roleIds.length) throw new DomainError('NOT_FOUND', 404);
    if (assignment.branchAccess === 'ALL' && assignment.branchIds.length) throw new DomainError('BAD_REQUEST', 400);
    const branches = await tx.branch.count({ where: { organizationId, id: { in: assignment.branchIds }, archivedAt: null } });
    if (branches !== assignment.branchIds.length) throw new DomainError('NOT_FOUND', 404);
    return new Set(roles.flatMap((role) => role.permissions.map((p) => p.permissionCode)));
  }
  async delegate(tx: Tx, actor: Awaited<ReturnType<OrganizationPolicy['actor']>>, assignment: AccessAssignmentDto,
    target?: Awaited<ReturnType<OrganizationPolicy['actor']>>) {
    const granted = await this.validateAssignment(tx, actor.organizationId, assignment);
    if (target?.isOwner) throw new DomainError('OWNER_TRANSFER_REQUIRED', 409);
    if (actor.isOwner) return;
    const own = this.permissions(actor);
    if (!own.has('STAFF_MANAGE') || target?.id === actor.id || [...granted].some((p) => !own.has(p) || controlPermissions.has(p)) ||
      (target && [...this.permissions(target)].some((p) => !own.has(p) || controlPermissions.has(p)))) throw new DomainError('FORBIDDEN', 403);
    if (actor.branchAccess === 'SELECTED') {
      const allowed = new Set(actor.branches.map((b) => b.branchId));
      if (assignment.branchAccess === 'ALL' || assignment.branchIds.some((id) => !allowed.has(id)) ||
        (target && (target.branchAccess === 'ALL' || target.branches.some((b) => !allowed.has(b.branchId))))) throw new DomainError('FORBIDDEN', 403);
    }
  }
  async replaceAssignment(tx: Tx, organizationId: string, membershipId: string, assignment: AccessAssignmentDto) {
    // Explicit join writes avoid nested create ambiguity from shared composite FK columns.
    await tx.membershipRole.deleteMany({ where: { membershipId, organizationId } });
    await tx.branchGrant.deleteMany({ where: { membershipId, organizationId } });
    if (assignment.roleIds.length) await tx.membershipRole.createMany({ data: assignment.roleIds.map((roleId) => ({ organizationId, membershipId, roleId })) });
    if (assignment.branchIds.length) await tx.branchGrant.createMany({ data: assignment.branchIds.map((branchId) => ({ organizationId, membershipId, branchId })) });
  }
  async permissionCodes(tx: Tx, codes: string[]) {
    if (await tx.permission.count({ where: { code: { in: codes } } }) !== codes.length) throw new DomainError('BAD_REQUEST', 400);
  }
  async branch(tx: Tx, scope: TenantScope, id: string) {
    const branch = await tx.branch.findFirst({ where: { organizationId: scope.organizationId, id, archivedAt: null,
      ...(scope.branchIds === null ? {} : { id: { in: [...scope.branchIds], equals: id } }), ...(scope.branchId ? { id: { equals: id, in: [scope.branchId] } } : {}) }, select: branchSelect });
    if (!branch) throw new DomainError('NOT_FOUND', 404);
    return branch;
  }
}
