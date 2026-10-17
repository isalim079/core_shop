import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '../../generated/prisma/client';
import { DomainError } from '../errors/domain-error';

export interface TenantScope {
  readonly actorId: string;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly branchId?: string;
  readonly branchIds: readonly string[] | null;
  readonly requiredPermissions: readonly string[];
}

@Injectable()
export class TenantAuthorization {
  private readonly issued = new WeakSet<TenantScope>();
  constructor(private readonly database: DatabaseService) {}

  async resolve(actorId: string, organizationId: string, branchId: string | undefined, required: readonly string[], tx?: Prisma.TransactionClient): Promise<TenantScope> {
    const client = tx || this.database.client;
    if (!client) throw new DomainError('SERVICE_UNAVAILABLE', 503);
    const membership = await client.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId: actorId } },
      include: {
        user: { select: { status: true, deletedAt: true } }, organization: { select: { status: true } },
        branches: { include: { branch: { select: { archivedAt: true } } } },
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });
    if (!membership || membership.status !== 'ACTIVE' || membership.user.status !== 'ACTIVE' || membership.user.deletedAt || membership.organization.status !== 'ACTIVE') {
      throw new DomainError('FORBIDDEN', 403);
    }
    // Owners still require recognized permission codes; no arbitrary capability names.
    const known = await client.permission.count({ where: { code: { in: [...required] } } });
    if (known !== new Set(required).size) throw new DomainError('FORBIDDEN', 403);
    const granted = new Set(membership.roles.filter(({ role }) => !role.archivedAt).flatMap(({ role }) => role.permissions.map((p) => p.permissionCode)));
    if (!membership.isOwner && required.some((code) => !granted.has(code))) throw new DomainError('FORBIDDEN', 403);
    const branchIds = membership.branchAccess === 'ALL' ? null : Object.freeze(membership.branches.filter((g) => !g.branch.archivedAt).map((g) => g.branchId));
    if (branchId) {
      const branch = await client.branch.findFirst({ where: { id: branchId, organizationId, archivedAt: null }, select: { id: true } });
      if (!branch || (branchIds !== null && !branchIds.includes(branchId))) throw new DomainError('FORBIDDEN', 403);
    }
    const scope = Object.freeze({ actorId, organizationId, membershipId: membership.id, branchId, branchIds,
      requiredPermissions: Object.freeze([...new Set(required)]) });
    this.issued.add(scope);
    return scope;
  }

  assertIssued(scope: TenantScope) {
    if (!this.issued.has(scope)) throw new DomainError('FORBIDDEN', 403);
  }

  async revalidate(scope: TenantScope, tx: Prisma.TransactionClient) {
    this.assertIssued(scope);
    // Lock authorization rows for the duration of a sensitive command.
    await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${scope.organizationId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${scope.actorId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM memberships WHERE id = ${scope.membershipId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT "membershipId" FROM membership_roles WHERE "membershipId" = ${scope.membershipId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT rp."roleId" FROM role_permissions rp JOIN membership_roles mr ON mr."roleId"=rp."roleId"
      WHERE mr."membershipId"=${scope.membershipId}::uuid FOR SHARE OF rp`;
    await tx.$queryRaw`SELECT "membershipId" FROM branch_grants WHERE "membershipId" = ${scope.membershipId}::uuid FOR SHARE`;
    if (scope.branchId) await tx.$queryRaw`SELECT id FROM branches WHERE id = ${scope.branchId}::uuid FOR SHARE`;
    return this.resolve(scope.actorId, scope.organizationId, scope.branchId, scope.requiredPermissions, tx);
  }
}

export function tenantWhere<T extends object>(scope: TenantScope, where: T) {
  return { AND: [{ organizationId: scope.organizationId }, where] };
}

export function branchWhere(scope: TenantScope) {
  return scope.branchId ? { branchId: scope.branchId } : scope.branchIds === null ? {} : { branchId: { in: [...scope.branchIds] } };
}
