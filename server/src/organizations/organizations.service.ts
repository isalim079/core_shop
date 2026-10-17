import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error';
import { Principal } from '../common/guards/access';
import { TenantScope } from '../common/guards/tenant-authorization';
import { payloadHash } from '../common/commands/canonical-payload';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { BrandingDto, CreateBranchDto, CreateOrganizationDto, CreateRoleDto, TransferOwnershipDto, UpdateBranchDto, UpdateMembershipDto, UpdateOrganizationDto, UpdateRoleDto } from './organization.dto';
import { branchSelect, controlPermissions, memberInclude, organizationSelect, OrganizationPolicy, page, pageWhere } from './organization-policy.service';
import { ROLE_PRESETS } from './permissions';

@Injectable()
export class Organizations {
  constructor(readonly policy: OrganizationPolicy) {}
  async create(principal: Principal, input: CreateOrganizationDto, key: string, requestId: string, ip: string) {
    await this.policy.auth.limit('organization-create', ip, principal.userId);
    if (!Intl.supportedValuesOf('currency').includes(input.currency)) throw new DomainError('BAD_REQUEST', 400);
    const standardScale = new Intl.NumberFormat('en', { style: 'currency', currency: input.currency }).resolvedOptions().maximumFractionDigits;
    const data = { name: input.name.trim(), currency: input.currency, currencyScale: input.currencyScale ?? standardScale, timezone: input.timezone,
      quantityScale: input.quantityScale ?? 3, address: input.address ?? null, documentLanguage: input.documentLanguage ?? 'en' };
    const hash = payloadHash(data);
    return this.policy.db.$transaction(async (tx) => {
      const user = await this.policy.auth.lockUser(tx, principal.userId);
      if (!user || (!user.emailVerifiedAt && !user.phoneVerifiedAt)) throw new DomainError('UNAUTHENTICATED', 401);
      await this.policy.auth.requireSession(tx, user.id, principal.credentialId);
      const existing = await tx.organizationCreation.findUnique({ where: { userId_key: { userId: user.id, key } } });
      if (existing) {
        if (existing.payloadHash !== hash) throw new DomainError('IDEMPOTENCY_PAYLOAD_MISMATCH', 409);
        const membership = await tx.membership.findUnique({ where: { organizationId_userId: { organizationId: existing.organizationId, userId: user.id } } });
        if (!membership || membership.status !== 'ACTIVE') throw new DomainError('FORBIDDEN', 403);
        return existing.result;
      }
      const zones = await tx.$queryRaw<Array<{ name: string }>>`SELECT name FROM pg_timezone_names WHERE name = ${data.timezone}`;
      if (!zones.length) throw new DomainError('BAD_REQUEST', 400);
      const organization = await tx.organization.create({ data: { ...data, status: 'ACTIVE' } });
      const membership = await tx.membership.create({ data: { organizationId: organization.id, userId: user.id, isOwner: true, status: 'ACTIVE', branchAccess: 'ALL' } });
      const branch = await tx.branch.create({ data: { organizationId: organization.id, code: 'MAIN', name: 'Main branch', address: data.address } });
      for (const [code, preset] of Object.entries(ROLE_PRESETS)) {
        await this.policy.permissionCodes(tx, [...preset.permissions]);
        await tx.role.create({ data: { organizationId: organization.id, code, name: preset.name,
          permissions: { create: preset.permissions.map((permissionCode) => ({ permissionCode })) } } });
      }
      const result = { organizationId: organization.id, membershipId: membership.id, branchId: branch.id };
      await tx.organizationCreation.create({ data: { userId: user.id, key, payloadHash: hash, organizationId: organization.id, result } });
      await tx.auditEvent.create({ data: { organizationId: organization.id, actorId: user.id, requestId, action: 'ORGANIZATION_CREATED', entityType: 'ORGANIZATION', entityId: organization.id, metadata: {} } });
      return result;
    }, { maxWait: 3000, timeout: 10_000 });
  }
  async list(principal: Principal, query: PaginationQueryDto) {
    const rows = await this.policy.db.organization.findMany({ where: { AND: [pageWhere(query), { status: 'ACTIVE', memberships: { some: { userId: principal.userId, status: 'ACTIVE' } } }] },
      select: { ...organizationSelect, memberships: { where: { userId: principal.userId }, select: { id: true, isOwner: true, branchAccess: true } } },
      orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 });
    return page(rows, query);
  }
  details(scope: TenantScope) { return this.policy.read(scope, (tx) => tx.organization.findUniqueOrThrow({ where: { id: scope.organizationId }, select: organizationSelect })); }
  context(scope: TenantScope) {
    return this.policy.read(scope, async (tx, current) => {
      const actor = await this.policy.actor(tx, current);
      const permissions = actor.isOwner ? (await tx.permission.findMany({ select: { code: true } })).map((p) => p.code) : [...this.policy.permissions(actor)];
      return { organizationId: current.organizationId, membershipId: actor.id, isOwner: actor.isOwner, branchAccess: actor.branchAccess,
        branchIds: current.branchIds, selectedBranchId: current.branchId ?? null, permissionCodes: permissions.sort(),
        roles: actor.roles.filter(({ role }) => !role.archivedAt).map(({ role }) => ({ id: role.id, code: role.code, name: role.name })) };
    });
  }
  update(scope: TenantScope, p: Principal, input: UpdateOrganizationDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, 'ORGANIZATION_UPDATE', input, async (tx) => {
      const organization = await tx.organization.update({ where: { id: scope.organizationId }, data: input, select: organizationSelect });
      return { body: organization, entityId: organization.id };
    }, 'ORGANIZATION_UPDATED', 'ORGANIZATION');
  }
  branding(scope: TenantScope, p: Principal, input: BrandingDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, 'ORGANIZATION_BRANDING_UPDATE', input, async (tx) => {
      for (const [field, purpose] of [['logoFileId', 'ORGANIZATION_LOGO'], ['coverFileId', 'ORGANIZATION_COVER']] as const) {
        if (input[field] && !await tx.storedFile.findFirst({ where: { id: input[field], organizationId: scope.organizationId, purpose, status: 'READY', deletedAt: null } })) throw new DomainError('NOT_FOUND', 404);
      }
      const branding = await tx.organizationBranding.upsert({ where: { organizationId: scope.organizationId }, create: { organizationId: scope.organizationId, ...input }, update: input,
        select: { organizationId: true, logoFileId: true, coverFileId: true } });
      return { body: branding, entityId: scope.organizationId };
    }, 'ORGANIZATION_BRANDING_UPDATED', 'ORGANIZATION');
  }
  branches(scope: TenantScope, query: PaginationQueryDto) {
    return this.policy.read(scope, async (tx, current) => page(await tx.branch.findMany({ where: { AND: [pageWhere(query), { organizationId: current.organizationId, archivedAt: null,
      ...(current.branchIds === null ? {} : { id: { in: [...current.branchIds] } }), ...(current.branchId ? { id: current.branchId } : {}) }] },
      select: branchSelect, orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 }), query));
  }
  createBranch(scope: TenantScope, p: Principal, input: CreateBranchDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, 'BRANCH_CREATE', input, async (tx, current) => {
      if (current.branchIds !== null) throw new DomainError('FORBIDDEN', 403);
      const branch = await tx.branch.create({ data: { organizationId: current.organizationId, ...input }, select: branchSelect });
      return { body: branch, entityId: branch.id };
    }, 'BRANCH_CREATED', 'BRANCH', 201);
  }
  updateBranch(scope: TenantScope, p: Principal, id: string, input: UpdateBranchDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `BRANCH_UPDATE:${id}`, input, async (tx, current) => {
      await this.policy.branch(tx, current, id);
      return { body: await tx.branch.update({ where: { id }, data: input, select: branchSelect }), entityId: id };
    }, 'BRANCH_UPDATED', 'BRANCH');
  }
  archiveBranch(scope: TenantScope, p: Principal, id: string, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `BRANCH_ARCHIVE:${id}`, {}, async (tx, current) => {
      await this.policy.branch(tx, current, id);
      if (await tx.branch.count({ where: { organizationId: current.organizationId, archivedAt: null } }) <= 1) throw new DomainError('LAST_BRANCH_REQUIRED', 409);
      return { body: await tx.branch.update({ where: { id }, data: { archivedAt: new Date() }, select: branchSelect }), entityId: id };
    }, 'BRANCH_ARCHIVED', 'BRANCH');
  }
  roles(scope: TenantScope, query: PaginationQueryDto) {
    return this.policy.read(scope, async (tx) => page(await tx.role.findMany({ where: { AND: [pageWhere(query), { organizationId: scope.organizationId, archivedAt: null }] },
      select: { id: true, code: true, name: true, createdAt: true, permissions: { select: { permissionCode: true } } },
      orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 }), query));
  }
  createRole(scope: TenantScope, p: Principal, input: CreateRoleDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, 'ROLE_CREATE', input, async (tx, current) => {
      await this.policy.owner(tx, current); await this.policy.permissionCodes(tx, input.permissionCodes);
      const role = await tx.role.create({ data: { organizationId: current.organizationId, code: input.code, name: input.name,
        permissions: { create: input.permissionCodes.map((permissionCode) => ({ permissionCode })) } }, select: { id: true, code: true, name: true } });
      return { body: role, entityId: role.id };
    }, 'ROLE_CREATED', 'ROLE', 201);
  }
  updateRole(scope: TenantScope, p: Principal, id: string, input: UpdateRoleDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `ROLE_UPDATE:${id}`, input, async (tx, current) => {
      await this.policy.owner(tx, current);
      const role = await tx.role.findFirst({ where: { id, organizationId: current.organizationId, archivedAt: null } });
      if (!role) throw new DomainError('NOT_FOUND', 404);
      if (input.permissionCodes) {
        await this.policy.permissionCodes(tx, input.permissionCodes);
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (input.permissionCodes.length) await tx.rolePermission.createMany({ data: input.permissionCodes.map((permissionCode) => ({ roleId: id, permissionCode })) });
      }
      const updated = await tx.role.update({ where: { id }, data: { name: input.name }, select: { id: true, code: true, name: true, permissions: { select: { permissionCode: true } } } });
      return { body: updated, entityId: id };
    }, 'ROLE_UPDATED', 'ROLE');
  }
  archiveRole(scope: TenantScope, p: Principal, id: string, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `ROLE_ARCHIVE:${id}`, {}, async (tx, current) => {
      await this.policy.owner(tx, current);
      const role = await tx.role.findFirst({ where: { id, organizationId: current.organizationId, archivedAt: null } });
      if (!role) throw new DomainError('NOT_FOUND', 404);
      if (await tx.membershipRole.count({ where: { roleId: id, membership: { status: 'ACTIVE' } } }) || await tx.membershipInvitation.count({ where: { organizationId: current.organizationId, roleIds: { has: id }, status: 'PENDING', expiresAt: { gt: new Date() } } })) throw new DomainError('CONFLICT', 409);
      await tx.role.update({ where: { id }, data: { archivedAt: new Date() } });
      return { body: { id, archived: true }, entityId: id };
    }, 'ROLE_ARCHIVED', 'ROLE');
  }
  members(scope: TenantScope, query: PaginationQueryDto) {
    return this.policy.read(scope, async (tx, current) => {
      const actor = await this.policy.actor(tx, current);
      const own = [...this.policy.permissions(actor)].filter((permission) => !controlPermissions.has(permission));
      const manageable = actor.isOwner ? {} : { OR: [{ id: actor.id }, { isOwner: false,
        roles: { every: { role: { OR: [{ archivedAt: { not: null } }, { permissions: { every: { permissionCode: { in: own } } } }] } } },
        ...(actor.branchAccess === 'ALL' ? {} : { branchAccess: 'SELECTED' as const, branches: { every: { branchId: { in: actor.branches.map((b) => b.branchId) } } } }) }] };
      return page(await tx.membership.findMany({ where: { AND: [pageWhere(query), { organizationId: current.organizationId }, manageable] },
        select: { id: true, userId: true, status: true, isOwner: true, branchAccess: true, createdAt: true,
          user: { select: { displayName: true } }, roles: { select: { roleId: true } }, branches: { select: { branchId: true } } },
        orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 }), query);
    });
  }
  updateMember(scope: TenantScope, p: Principal, id: string, input: UpdateMembershipDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `MEMBERSHIP_UPDATE:${id}`, input, async (tx, current) => {
      const actor = await this.policy.actor(tx, current);
      const target = await tx.membership.findFirst({ where: { id, organizationId: current.organizationId }, include: memberInclude });
      if (!target) throw new DomainError('NOT_FOUND', 404);
      await this.policy.delegate(tx, actor, input, target);
      if (input.status === 'ACTIVE' && !await tx.user.findFirst({ where: { id: target.userId, status: 'ACTIVE', deletedAt: null } })) throw new DomainError('BUSINESS_RULE_VIOLATION', 422);
      const updated = await tx.membership.update({ where: { id }, data: { status: input.status, branchAccess: input.branchAccess },
        select: { id: true, userId: true, status: true, branchAccess: true } });
      await this.policy.replaceAssignment(tx, current.organizationId, id, input);
      return { body: updated, entityId: id };
    }, 'MEMBERSHIP_UPDATED', 'MEMBERSHIP');
  }
  transfer(scope: TenantScope, p: Principal, input: TransferOwnershipDto, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, 'OWNERSHIP_TRANSFER', input, async (tx, current) => {
      const actor = await this.policy.owner(tx, current);
      await this.policy.auth.requireSession(tx, p.userId, p.credentialId, true);
      const target = await tx.membership.findFirst({ where: { id: input.membershipId, organizationId: current.organizationId, status: 'ACTIVE', isOwner: false, user: { status: 'ACTIVE', deletedAt: null } } });
      if (!target || target.id === actor.id) throw new DomainError('NOT_FOUND', 404);
      await this.policy.validateAssignment(tx, current.organizationId, { roleIds: input.previousOwnerRoleIds, branchAccess: 'ALL', branchIds: [] });
      await tx.membership.update({ where: { id: target.id }, data: { isOwner: true, branchAccess: 'ALL' } });
      await this.policy.replaceAssignment(tx, current.organizationId, target.id, { roleIds: [], branchAccess: 'ALL', branchIds: [] });
      await tx.membership.update({ where: { id: actor.id }, data: { isOwner: false } });
      await this.policy.replaceAssignment(tx, current.organizationId, actor.id, { roleIds: input.previousOwnerRoleIds, branchAccess: 'ALL', branchIds: [] });
      return { body: { organizationId: current.organizationId, ownerMembershipId: target.id, previousOwnerMembershipId: actor.id }, entityId: target.id };
    }, 'OWNERSHIP_TRANSFERRED', 'MEMBERSHIP');
  }
}
