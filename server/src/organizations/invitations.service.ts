import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { contact } from '../auth/auth-primitives';
import { DomainError } from '../common/errors/domain-error';
import { Principal } from '../common/guards/access';
import { TenantScope } from '../common/guards/tenant-authorization';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { CreateInvitationDto } from './organization.dto';
import { memberInclude, OrganizationPolicy, page, pageWhere } from './organization-policy.service';

const safeInvitation = { id: true, channel: true, status: true, roleIds: true, branchAccess: true, branchIds: true, expiresAt: true, createdAt: true } as const;
@Injectable()
export class Invitations {
  constructor(private readonly policy: OrganizationPolicy) {}
  create(scope: TenantScope, p: Principal, input: CreateInvitationDto, key: string, requestId: string) {
    const destination = contact(input.channel, input.contact);
    return this.policy.write(scope, p, key, requestId, 'INVITATION_CREATE', { ...input, contact: destination }, async (tx, current, commandId) => {
      const actor = await this.policy.actor(tx, current);
      await this.policy.delegate(tx, actor, input);
      const now = new Date();
      await tx.membershipInvitation.updateMany({ where: { organizationId: current.organizationId, channel: input.channel, destination, status: 'PENDING', expiresAt: { lte: now } }, data: { status: 'REVOKED' } });
      if (await tx.membershipInvitation.count({ where: { organizationId: current.organizationId, channel: input.channel, destination, status: 'PENDING' } })) throw new DomainError('CONFLICT', 409);
      const invitation = await tx.membershipInvitation.create({ data: { organizationId: current.organizationId, invitedByUserId: p.userId,
        channel: input.channel, destination, roleIds: input.roleIds, branchAccess: input.branchAccess, branchIds: input.branchIds,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000) }, select: safeInvitation });
      await this.policy.commands.enqueue(tx, current, commandId, 'MEMBERSHIP_INVITATION_CREATED', { entityId: invitation.id });
      return { body: invitation, entityId: invitation.id };
    }, 'MEMBERSHIP_INVITED', 'MEMBERSHIP_INVITATION', 201);
  }
  list(scope: TenantScope, query: PaginationQueryDto) {
    return this.policy.read(scope, async (tx, current) => {
      const actor = await this.policy.actor(tx, current);
      return page(await tx.membershipInvitation.findMany({ where: { AND: [pageWhere(query), { organizationId: scope.organizationId, ...(actor.isOwner ? {} : { invitedByUserId: actor.userId }) }] },
      select: { ...safeInvitation, destination: true, invitedByUserId: true, acceptedByUserId: true, acceptedAt: true },
      orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 }), query);
    });
  }
  revoke(scope: TenantScope, p: Principal, id: string, key: string, requestId: string) {
    return this.policy.write(scope, p, key, requestId, `INVITATION_REVOKE:${id}`, {}, async (tx, current) => {
      const invitation = await tx.membershipInvitation.findFirst({ where: { id, organizationId: current.organizationId } });
      if (!invitation) throw new DomainError('NOT_FOUND', 404);
      const actor = await this.policy.actor(tx, current);
      if (!actor.isOwner && invitation.invitedByUserId !== actor.userId) throw new DomainError('FORBIDDEN', 403);
      if (invitation.status !== 'PENDING') throw new DomainError('CONFLICT', 409);
      await tx.membershipInvitation.update({ where: { id }, data: { status: 'REVOKED' } });
      return { body: { id, status: 'REVOKED' }, entityId: id };
    }, 'MEMBERSHIP_INVITATION_REVOKED', 'MEMBERSHIP_INVITATION');
  }
  async incoming(p: Principal, query: PaginationQueryDto) {
    const user = await this.policy.db.user.findFirst({ where: { id: p.userId, status: 'ACTIVE', deletedAt: null } });
    if (!user) throw new DomainError('UNAUTHENTICATED', 401);
    const recipients: Prisma.MembershipInvitationWhereInput[] = [];
    if (user.email && user.emailVerifiedAt) recipients.push({ channel: 'EMAIL', destination: user.email });
    if (user.phone && user.phoneVerifiedAt) recipients.push({ channel: 'PHONE', destination: user.phone });
    if (!recipients.length) return { items: [], nextCursor: null };
    return page(await this.policy.db.membershipInvitation.findMany({ where: { AND: [pageWhere(query), { OR: recipients, status: 'PENDING', expiresAt: { gt: new Date() }, organization: { status: 'ACTIVE' } }] },
      select: { ...safeInvitation, organization: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: query.direction }, { id: query.direction }], take: query.limit + 1 }), query);
  }
  async accept(p: Principal, id: string, requestId: string) {
    // The UUID selects an offer. It is never an authentication credential.
    const before = await this.policy.db.membershipInvitation.findUnique({ where: { id } });
    if (!before) throw new DomainError('NOT_FOUND', 404);
    return this.policy.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${before.organizationId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${p.userId}::uuid FOR SHARE`;
      await this.policy.auth.requireSession(tx, p.userId, p.credentialId);
      const user = await tx.user.findFirst({ where: { id: p.userId, status: 'ACTIVE', deletedAt: null } });
      const invitation = await tx.membershipInvitation.findUnique({ where: { id }, include: { organization: { select: { status: true } } } });
      const matches = user && invitation && (invitation.channel === 'EMAIL' ? user.emailVerifiedAt && user.email === invitation.destination : user.phoneVerifiedAt && user.phone === invitation.destination);
      if (!matches || !invitation || invitation.organization.status !== 'ACTIVE') throw new DomainError('NOT_FOUND', 404);
      const existing = await tx.membership.findUnique({ where: { organizationId_userId: { organizationId: invitation.organizationId, userId: p.userId } } });
      if (invitation.status === 'ACCEPTED' && invitation.acceptedByUserId === p.userId && existing?.status === 'ACTIVE') return { membershipId: existing.id, organizationId: existing.organizationId };
      if (invitation.status !== 'PENDING' || invitation.expiresAt <= new Date() || existing) throw new DomainError('INVITATION_UNAVAILABLE', 409);
      // Recheck current issuer privileges: a stale offer cannot survive revoked delegation rights.
      const issuer = await tx.membership.findFirst({ where: { organizationId: invitation.organizationId, userId: invitation.invitedByUserId, status: 'ACTIVE', user: { status: 'ACTIVE', deletedAt: null } }, include: memberInclude });
      if (!issuer) throw new DomainError('INVITATION_UNAVAILABLE', 409);
      try { await this.policy.delegate(tx, issuer, invitation); }
      catch (error) { if (error instanceof DomainError) throw new DomainError('INVITATION_UNAVAILABLE', 409); throw error; }
      const membership = await tx.membership.create({ data: { organizationId: invitation.organizationId, userId: p.userId, status: 'ACTIVE', branchAccess: invitation.branchAccess } });
      await this.policy.replaceAssignment(tx, invitation.organizationId, membership.id, invitation);
      if (invitation.expiresAt <= new Date()) throw new DomainError('INVITATION_UNAVAILABLE', 409);
      await tx.membershipInvitation.update({ where: { id }, data: { status: 'ACCEPTED', acceptedByUserId: p.userId, acceptedAt: new Date() } });
      await tx.auditEvent.create({ data: { organizationId: invitation.organizationId, actorId: p.userId, requestId, action: 'MEMBERSHIP_INVITATION_ACCEPTED', entityType: 'MEMBERSHIP', entityId: membership.id, metadata: {} } });
      return { membershipId: membership.id, organizationId: membership.organizationId };
    }, { maxWait: 3000, timeout: 10_000 });
  }
}
