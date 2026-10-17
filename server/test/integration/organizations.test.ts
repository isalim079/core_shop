import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { randomUUID, randomInt, randomBytes, createHash } from 'node:crypto';
import { after, before, test } from 'node:test';
import { createRequire } from 'node:module';
import type { CreateOrganizationDto } from '../../src/organizations/organization.dto';
const compiled = createRequire(__filename);
const { createApp } = compiled('../../dist/app') as typeof import('../../src/app');
const { AuthStore } = compiled('../../dist/auth/auth-store.service') as typeof import('../../src/auth/auth-store.service');
const { Passwords } = compiled('../../dist/auth/auth-primitives') as typeof import('../../src/auth/auth-primitives');
const { Sessions } = compiled('../../dist/auth/sessions.service') as typeof import('../../src/auth/sessions.service');
const { Organizations } = compiled('../../dist/organizations/organizations.service') as typeof import('../../src/organizations/organizations.service');
const { TenantAuthorization } = compiled('../../dist/common/guards/tenant-authorization') as typeof import('../../src/common/guards/tenant-authorization');
const target = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !target.pathname.startsWith('/core_shop_test_')) throw new Error('Organization tests require a disposable database.');
let app: Awaited<ReturnType<typeof createApp>>;
let store: InstanceType<typeof AuthStore>;
let sharedHash: string;
let ip = 0;
interface Actor { id: string; contact: string; channel: 'EMAIL' | 'PHONE'; accessToken: string; sessionId: string }
interface Shop { organizationId: string; membershipId: string; branchId: string }
interface Role { id: string; code: string; permissions: Array<{ permissionCode: string }> }
const newEmail = () => `${randomUUID()}@example.test`;
const definition: CreateOrganizationDto = { name: 'রহিমের দোকান', currency: 'BDT', timezone: 'Asia/Dhaka', documentLanguage: 'en-bn' };
function call(method: string, path: string, actor?: Actor, org?: string, payload?: object, headers: Record<string, string> = {}, key: string | null = randomUUID()) {
  return app.inject({ method: method as 'GET', url: `/api/v1/${path}`, ...(payload ? { payload } : {}), remoteAddress: `198.19.${Math.floor(++ip / 250)}.${ip % 250 + 1}`,
    headers: { ...(actor ? { authorization: `Bearer ${actor.accessToken}` } : {}), ...(org ? { 'x-organization-id': org } : {}), ...(key ? { 'idempotency-key': key } : {}), ...headers } });
}
async function actor(channel: 'EMAIL' | 'PHONE' = 'EMAIL', destination?: string, verified = true): Promise<Actor> {
  const contact = destination ?? (channel === 'EMAIL' ? newEmail() : `+88017${randomInt(10_000_000, 100_000_000)}`);
  const user = await store.db.user.create({ data: { displayName: 'Test user', status: 'ACTIVE', passwordHash: sharedHash,
    ...(channel === 'EMAIL' ? { email: contact, emailVerifiedAt: verified ? new Date() : null } : { phone: contact, phoneVerifiedAt: verified ? new Date() : null }) } });
  const tokens = await store.db.$transaction(async (tx) => { await store.lockUser(tx, user.id); return app.get(Sessions).create(tx, user.id, 'MOBILE', 'Tenant test', randomUUID()); });
  return { id: user.id, contact, channel, accessToken: tokens.accessToken, sessionId: tokens.sessionId };
}
async function shop(owner: Actor, key = randomUUID()): Promise<Shop> {
  const r = await call('POST', 'organizations', owner, undefined, definition, {}, key);
  assert.equal(r.statusCode, 201, r.body); return r.json();
}
async function roles(owner: Actor, s: Shop): Promise<Role[]> {
  const r = await call('GET', `organizations/${s.organizationId}/roles`, owner, s.organizationId);
  assert.equal(r.statusCode, 200, r.body); return r.json().items;
}
async function offer(owner: Actor, s: Shop, recipient: Actor | { contact: string; channel: 'EMAIL' | 'PHONE' }, roleIds: string[], branchIds: string[] = [], branchAccess = 'ALL') {
  const r = await call('POST', `organizations/${s.organizationId}/invitations`, owner, s.organizationId, { channel: recipient.channel, contact: recipient.contact, roleIds, branchIds, branchAccess });
  assert.equal(r.statusCode, 201, r.body); return r.json();
}
async function join(owner: Actor, s: Shop, recipient: Actor, code = 'CASHIER', branchIds: string[] = [], branchAccess = 'ALL') {
  const role = (await roles(owner, s)).find((r) => r.code === code)!;
  const invitation = await offer(owner, s, recipient, [role.id], branchIds, branchAccess);
  const accepted = await call('POST', `organizations/invitations/${invitation.id}/accept`, recipient);
  assert.equal(accepted.statusCode, 201, accepted.body);
  return { ...accepted.json(), invitationId: invitation.id, roleId: role.id };
}
async function branch(owner: Actor, s: Shop, code = 'B_' + randomUUID().slice(0, 8).toUpperCase()) {
  const r = await call('POST', `organizations/${s.organizationId}/branches`, owner, s.organizationId, { code, name: 'Branch' });
  assert.equal(r.statusCode, 201, r.body); return r.json();
}
async function customRole(owner: Actor, s: Shop, permissionCodes: string[]) {
  const r = await call('POST', `organizations/${s.organizationId}/roles`, owner, s.organizationId, { code: 'CUSTOM_' + randomUUID().slice(0, 8).toUpperCase(), name: 'Custom role', permissionCodes });
  assert.equal(r.statusCode, 201, r.body); return r.json();
}
const context = (member: Actor, s: Shop, headers: Record<string, string> = {}) => call('GET', `organizations/${s.organizationId}/context`, member, s.organizationId, undefined, headers);
before(async () => { app = await createApp(); await app.init(); store = app.get(AuthStore); sharedHash = await app.get(Passwords).hash('Tenant integration password 123!'); });
after(async () => { await app?.close(); });

test('onboarding is atomic, verified, idempotent and validates financial settings', async () => {
  const owner = await actor(); const key = randomUUID(); const s = await shop(owner, key);
  const repeated = await shop(owner, key); assert.deepEqual(repeated, s);
  assert.equal(await store.db.organization.count({ where: { id: s.organizationId } }), 1);
  const org = await call('GET', `organizations/${s.organizationId}`, owner, s.organizationId);
  assert.equal(org.statusCode, 200); assert.equal(org.json().allowNegativeStock, false); assert.equal(org.json().documentLanguage, 'en-bn'); assert.equal(org.json().currencyScale, 2);
  assert.equal((await roles(owner, s)).length, 5);
  assert.equal((await context(owner, s)).json().isOwner, true);
  assert.equal((await call('POST', 'organizations', owner, undefined, { ...definition, name: 'Changed' }, {}, key)).statusCode, 409);
  assert.equal((await call('POST', 'organizations', owner, undefined, definition, {}, null)).statusCode, 400);
  for (const input of [{ ...definition, currency: 'ZZZ' }, { ...definition, timezone: 'Not/AZone' }, { ...definition, allowNegativeStock: true }, { ...definition, currencyScale: '2' }]) {
    assert.equal((await call('POST', 'organizations', owner, undefined, input)).statusCode, 400);
  }
  const unverified = await actor('EMAIL', undefined, false);
  assert.equal((await call('POST', 'organizations', unverified, undefined, definition)).statusCode, 401);
  assert.equal(await store.db.organizationCreation.count({ where: { userId: unverified.id } }), 0);
});

test('concurrent onboarding replay produces one organization and mismatched data conflicts', async () => {
  const owner = await actor(); const key = randomUUID();
  const r = await Promise.all([shop(owner, key), shop(owner, key)]); assert.deepEqual(r[0], r[1]);
  assert.equal(await store.db.organizationCreation.count({ where: { userId: owner.id } }), 1);
});

test('tenant selection checks actual membership, path/header agreement and bounded pagination', async () => {
  const owner = await actor(); const outsider = await actor(); const s = await shop(owner); const other = await shop(outsider);
  const listed = await call('GET', 'organizations?limit=1', owner); assert.equal(listed.statusCode, 200); assert.equal(listed.json().items[0].id, s.organizationId);
  assert.equal((await context(outsider, s)).statusCode, 403);
  assert.equal((await call('GET', `organizations/${s.organizationId}`, outsider, other.organizationId)).statusCode, 404);
  assert.equal((await call('GET', `organizations/${s.organizationId}`, owner)).statusCode, 400);
  assert.equal((await call('GET', `organizations/${s.organizationId}`, undefined, s.organizationId)).statusCode, 401);
  for (const query of ['limit=101', 'cursor=bad-json', 'limit=1&limit=2']) assert.equal((await call('GET', `organizations?${query}`, owner)).statusCode, 400);
  const current = (await context(owner, s)).json(); assert.ok(current.permissionCodes.includes('BILLING_MANAGE')); assert.equal(current.branchIds, null);
});

test('invitations bind to verified contacts and grant scoped cashier access, including phone recipients', async () => {
  const owner = await actor(); const cashier = await actor(); const outsider = await actor(); const s = await shop(owner);
  const role = (await roles(owner, s)).find((r) => r.code === 'CASHIER')!;
  const invitation = await offer(owner, s, cashier, [role.id], [s.branchId], 'SELECTED');
  assert.equal((await call('GET', 'organizations/invitations/incoming', cashier)).json().items[0].id, invitation.id);
  assert.equal((await call('GET', 'organizations/invitations/incoming', outsider)).json().items.length, 0);
  assert.equal((await call('POST', `organizations/invitations/${invitation.id}/accept`, outsider)).statusCode, 404);
  const acceptance = await call('POST', `organizations/invitations/${invitation.id}/accept`, cashier); assert.equal(acceptance.statusCode, 201, acceptance.body);
  assert.deepEqual((await call('POST', `organizations/invitations/${invitation.id}/accept`, cashier)).json(), acceptance.json());
  const resolved = (await context(cashier, s)).json(); assert.equal(resolved.isOwner, false); assert.deepEqual(resolved.branchIds, [s.branchId]); assert.ok(resolved.permissionCodes.includes('SALE_CREATE')); assert.ok(!resolved.permissionCodes.includes('STAFF_MANAGE'));
  assert.equal((await call('PATCH', `organizations/${s.organizationId}`, cashier, s.organizationId, { name: 'Escalation' })).statusCode, 403);
  assert.equal((await call('GET', `organizations/${s.organizationId}/memberships`, cashier, s.organizationId)).statusCode, 403);
  const phone = await actor('PHONE'); await join(owner, s, phone);
  assert.equal((await context(phone, s)).statusCode, 200);
  const events = await store.db.outboxEvent.findMany({ where: { organizationId: s.organizationId } });
  assert.ok(events.length >= 2); assert.ok(events.every((e) => Object.keys(e.payload as object).join(',') === 'entityId'));
});

test('foreign role, branch and membership references fail without tenant leaks', async () => {
  const owner = await actor(); const otherOwner = await actor(); const member = await actor(); const s = await shop(owner); const other = await shop(otherOwner);
  const role = (await roles(owner, s))[0]; const foreignRole = (await roles(otherOwner, other))[0];
  const input = { channel: member.channel, contact: member.contact, roleIds: [foreignRole.id], branchAccess: 'ALL', branchIds: [] };
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, owner, s.organizationId, input)).statusCode, 404);
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, owner, s.organizationId, { ...input, roleIds: [role.id], branchAccess: 'SELECTED', branchIds: [other.branchId] })).statusCode, 404);
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, owner, s.organizationId, { ...input, roleIds: [role.id], branchIds: [s.branchId] })).statusCode, 400);
  const assignment = { status: 'ACTIVE', roleIds: [], branchAccess: 'ALL', branchIds: [] };
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${other.membershipId}`, owner, s.organizationId, assignment)).statusCode, 404);
  const ownerChange = await call('PATCH', `organizations/${s.organizationId}/memberships/${s.membershipId}`, owner, s.organizationId, { ...assignment, status: 'REVOKED' });
  assert.equal(ownerChange.statusCode, 409); assert.equal(ownerChange.json().error.code, 'OWNER_TRANSFER_REQUIRED');
  assert.equal((await call('POST', `organizations/${s.organizationId}/roles`, owner, s.organizationId, { code: 'FAKE', name: 'Bad', permissionCodes: ['PLATFORM_ADMIN'] })).statusCode, 400);
});

test('admins can delegate ordinary staff capabilities but cannot edit roles, peers, themselves or ownership', async () => {
  const owner = await actor(); const admin = await actor(); const cashier = await actor(); const peer = await actor(); const s = await shop(owner);
  const adminMembership = await join(owner, s, admin, 'ADMIN'); const peerMembership = await join(owner, s, peer, 'ADMIN');
  const list = await roles(owner, s); const adminRole = list.find((r) => r.code === 'ADMIN')!; const cashierRole = list.find((r) => r.code === 'CASHIER')!;
  assert.equal((await call('POST', `organizations/${s.organizationId}/roles`, admin, s.organizationId, { code: 'POWER', name: 'Power', permissionCodes: ['BILLING_MANAGE'] })).statusCode, 403);
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, admin, s.organizationId, { channel: cashier.channel, contact: cashier.contact, roleIds: [adminRole.id], branchAccess: 'ALL', branchIds: [] })).statusCode, 403);
  await offer(admin, s, cashier, [cashierRole.id]);
  const update = { status: 'SUSPENDED', roleIds: [cashierRole.id], branchAccess: 'ALL', branchIds: [] };
  for (const id of [adminMembership.membershipId, peerMembership.membershipId]) assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${id}`, admin, s.organizationId, update)).statusCode, 403);
  assert.equal((await call('POST', `organizations/${s.organizationId}/ownership/transfer`, admin, s.organizationId, { membershipId: peerMembership.membershipId, previousOwnerRoleIds: [] })).statusCode, 403);
});

test('selected-branch managers cannot widen grants, create branches or act on other branches', async () => {
  const owner = await actor(); const manager = await actor(); const target = await actor(); const s = await shop(owner); const otherBranch = await branch(owner, s);
  const presets = await roles(owner, s); const cashier = presets.find((r) => r.code === 'CASHIER')!;
  const limited = await customRole(owner, s, [...cashier.permissions.map((p) => p.permissionCode), 'STAFF_MANAGE', 'BRANCH_MANAGE']);
  const invitation = await offer(owner, s, manager, [limited.id], [s.branchId], 'SELECTED');
  assert.equal((await call('POST', `organizations/invitations/${invitation.id}/accept`, manager)).statusCode, 201);
  assert.deepEqual((await call('GET', `organizations/${s.organizationId}/branches`, manager, s.organizationId)).json().items.map((b: { id: string }) => b.id), [s.branchId]);
  assert.equal((await call('POST', `organizations/${s.organizationId}/branches`, manager, s.organizationId, { code: 'HIDDEN', name: 'Unauthorized' })).statusCode, 403);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/branches/${s.branchId}`, manager, s.organizationId, { name: 'Allowed rename' })).statusCode, 200);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/branches/${otherBranch.id}`, manager, s.organizationId, { name: 'Forbidden rename' })).statusCode, 404);
  assert.equal((await context(manager, s, { 'x-branch-id': otherBranch.id })).statusCode, 403);
  const dto = { channel: target.channel, contact: target.contact, roleIds: [cashier.id], branchAccess: 'ALL', branchIds: [] };
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, manager, s.organizationId, dto)).statusCode, 403);
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations`, manager, s.organizationId, { ...dto, branchAccess: 'SELECTED', branchIds: [otherBranch.id] })).statusCode, 403);
  const delegated = await offer(manager, s, target, [cashier.id], [s.branchId], 'SELECTED');
  assert.equal((await call('POST', `organizations/invitations/${delegated.id}/accept`, target)).statusCode, 201);
  const staff = await call('GET', `organizations/${s.organizationId}/memberships`, manager, s.organizationId);
  assert.equal(staff.statusCode, 200, staff.body);
  assert.deepEqual(staff.json().items.map((m: { userId: string }) => m.userId).sort(), [manager.id, target.id].sort());
  const outgoing = await call('GET', `organizations/${s.organizationId}/invitations`, manager, s.organizationId);
  assert.equal(outgoing.statusCode, 200, outgoing.body);
  assert.ok(outgoing.json().items.every((offer: { invitedByUserId: string }) => offer.invitedByUserId === manager.id));
});

test('revoked/suspended memberships lose access immediately and invitations cannot reactivate them', async () => {
  const owner = await actor(); const member = await actor(); const s = await shop(owner); const joined = await join(owner, s, member);
  const assignment = { roleIds: [joined.roleId], branchAccess: 'ALL', branchIds: [] };
  for (const status of ['SUSPENDED', 'REVOKED']) {
    assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${joined.membershipId}`, owner, s.organizationId, { ...assignment, status })).statusCode, 200);
    assert.equal((await context(member, s)).statusCode, 403);
    assert.equal((await call('GET', 'organizations', member)).json().items.length, 0);
    assert.equal((await call('POST', `organizations/invitations/${joined.invitationId}/accept`, member)).statusCode, 409);
    assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${joined.membershipId}`, owner, s.organizationId, { ...assignment, status: 'ACTIVE' })).statusCode, 200);
    assert.equal((await context(member, s)).statusCode, 200);
  }
});

test('role changes invalidate prior permissions and assigned/pending roles cannot be archived', async () => {
  const owner = await actor(); const member = await actor(); const s = await shop(owner); const role = await customRole(owner, s, ['ORG_VIEW', 'BRANCH_MANAGE']);
  const invitation = await offer(owner, s, member, [role.id]);
  assert.equal((await call('POST', `organizations/${s.organizationId}/roles/${role.id}/archive`, owner, s.organizationId)).statusCode, 409);
  assert.equal((await call('POST', `organizations/invitations/${invitation.id}/accept`, member)).statusCode, 201);
  await branch(member, s);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/roles/${role.id}`, owner, s.organizationId, { permissionCodes: ['ORG_VIEW'] })).statusCode, 200);
  assert.equal((await call('POST', `organizations/${s.organizationId}/branches`, member, s.organizationId, { code: 'NOPE', name: 'No rights' })).statusCode, 403);
  const unused = await customRole(owner, s, []);
  assert.equal((await call('POST', `organizations/${s.organizationId}/roles/${unused.id}/archive`, owner, s.organizationId)).statusCode, 200);
  assert.ok(!(await roles(owner, s)).some((r) => r.id === unused.id));
});

test('branch archival retains a live branch and parallel archives cannot remove every branch', async () => {
  const owner = await actor(); const s = await shop(owner);
  const last = await call('POST', `organizations/${s.organizationId}/branches/${s.branchId}/archive`, owner, s.organizationId);
  assert.equal(last.statusCode, 409); assert.equal(last.json().error.code, 'LAST_BRANCH_REQUIRED');
  const extra = await branch(owner, s);
  const results = await Promise.all([s.branchId, extra.id].map((id) => call('POST', `organizations/${s.organizationId}/branches/${id}/archive`, owner, s.organizationId)));
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [200, 409]);
  assert.equal(await store.db.branch.count({ where: { organizationId: s.organizationId, archivedAt: null } }), 1);
  const archived = await store.db.branch.findFirstOrThrow({ where: { organizationId: s.organizationId, archivedAt: { not: null } } });
  assert.equal((await context(owner, s, { 'x-branch-id': archived.id })).statusCode, 403);
});

test('ownership transfer is atomic, owner-only and does not silently give the former owner an admin role', async () => {
  const owner = await actor(); const next = await actor(); const s = await shop(owner); const joined = await join(owner, s, next, 'CASHIER', [s.branchId], 'SELECTED');
  const r = await call('POST', `organizations/${s.organizationId}/ownership/transfer`, owner, s.organizationId, { membershipId: joined.membershipId, previousOwnerRoleIds: [] });
  assert.equal(r.statusCode, 200, r.body);
  const current = (await context(next, s)).json(); assert.equal(current.isOwner, true); assert.equal(current.branchIds, null); assert.ok(current.permissionCodes.includes('BILLING_MANAGE'));
  const previous = (await context(owner, s)).json(); assert.equal(previous.isOwner, false); assert.deepEqual(previous.permissionCodes, []);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}`, owner, s.organizationId, { name: 'Old owner' })).statusCode, 403);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}`, next, s.organizationId, { name: 'New owner' })).statusCode, 200);
  assert.equal(await store.db.membership.count({ where: { organizationId: s.organizationId, isOwner: true, status: 'ACTIVE' } }), 1);
});

test('revoked issuers, expired offers and unverified recipients cannot accept invitations', async () => {
  const owner = await actor(); const admin = await actor(); const recipient = await actor(); const s = await shop(owner); const joined = await join(owner, s, admin, 'ADMIN');
  const cashier = (await roles(owner, s)).find((r) => r.code === 'CASHIER')!;
  const stale = await offer(admin, s, recipient, [cashier.id]);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${joined.membershipId}`, owner, s.organizationId, { status: 'REVOKED', roleIds: [], branchAccess: 'ALL', branchIds: [] })).statusCode, 200);
  assert.equal((await call('POST', `organizations/invitations/${stale.id}/accept`, recipient)).statusCode, 409);
  const unverified = await actor('EMAIL', undefined, false); const unproved = await offer(owner, s, unverified, [cashier.id]);
  assert.equal((await call('POST', `organizations/invitations/${unproved.id}/accept`, unverified)).statusCode, 404);
  const expiredRecipient = await actor();
  const expired = await store.db.membershipInvitation.create({ data: { organizationId: s.organizationId, invitedByUserId: owner.id, channel: 'EMAIL', destination: expiredRecipient.contact,
    roleIds: [cashier.id], branchAccess: 'ALL', branchIds: [], createdAt: new Date(Date.now() - 7200_000), expiresAt: new Date(Date.now() - 3600_000) } });
  assert.equal((await call('POST', `organizations/invitations/${expired.id}/accept`, expiredRecipient)).statusCode, 409);
  const pendingEmail = newEmail(); const pending = await offer(owner, s, { channel: 'EMAIL', contact: pendingEmail }, [cashier.id]);
  const later = await actor('EMAIL', pendingEmail);
  assert.equal((await call('POST', `organizations/invitations/${pending.id}/accept`, later)).statusCode, 201);
});

test('tenant commands replay once, mismatch safely, and audit evidence stays minimal', async () => {
  const owner = await actor(); const s = await shop(owner); const key = randomUUID(); const payload = { code: 'REPLAY', name: 'Idempotent branch' };
  const first = await call('POST', `organizations/${s.organizationId}/branches`, owner, s.organizationId, payload, {}, key);
  const second = await call('POST', `organizations/${s.organizationId}/branches`, owner, s.organizationId, payload, {}, key);
  assert.equal(first.statusCode, 201, first.body); assert.deepEqual(first.json(), second.json());
  assert.equal((await call('POST', `organizations/${s.organizationId}/branches`, owner, s.organizationId, { ...payload, name: 'Mismatch' }, {}, key)).statusCode, 409);
  assert.equal(await store.db.branch.count({ where: { organizationId: s.organizationId, code: 'REPLAY' } }), 1);
  const events = await store.db.auditEvent.findMany({ where: { organizationId: s.organizationId, action: 'BRANCH_CREATED' } });
  assert.equal(events.length, 1); assert.equal(events[0].actorId, owner.id); assert.equal(events[0].requestId, first.headers['x-request-id']);
  assert.deepEqual(Object.keys(events[0].metadata as object), ['commandId']);
  assert.equal(await store.db.commandRecord.count({ where: { organizationId: s.organizationId, key } }), 1);
});

async function readyImage(owner: Actor, s: Shop, purpose: 'ORGANIZATION_LOGO' | 'ORGANIZATION_COVER') {
  const id = randomUUID(); const sha = 'a'.repeat(64); const prefix = `organizations/${s.organizationId}/${id}`;
  await store.db.storedFile.create({ data: { id, organizationId: s.organizationId, uploadedByUserId: owner.id, purpose,
    bucket: 'core-shop-private', objectKey: `${prefix}/original`, originalName: 'image.png', declaredMimeType: 'image/png', expectedBytes: 100n, expiresAt: new Date(Date.now() + 3600_000) } });
  await store.db.storedFile.update({ where: { id }, data: { status: 'UPLOADED' } });
  await store.db.storedFile.update({ where: { id }, data: { status: 'QUARANTINED' } });
  await store.db.storedFile.update({ where: { id }, data: { status: 'READY', scanStatus: 'CLEAN', uploadedBytes: 100n, actualBytes: 100n, verifiedMimeType: 'image/png', sha256: sha, sourceEtag: 'source', finalEtag: 'final', finalObjectKey: `${prefix}/verified/${sha}`, width: 10, height: 10, verifiedAt: new Date() } });
  return id;
}

test('shop branding accepts only verified files of the correct tenant/purpose and supports clearing', async () => {
  const owner = await actor(); const otherOwner = await actor(); const s = await shop(owner); const other = await shop(otherOwner);
  const logo = await readyImage(owner, s, 'ORGANIZATION_LOGO'); const cover = await readyImage(owner, s, 'ORGANIZATION_COVER'); const foreign = await readyImage(otherOwner, other, 'ORGANIZATION_LOGO');
  const route = `organizations/${s.organizationId}/branding`;
  for (const id of [foreign, cover, randomUUID()]) assert.equal((await call('PATCH', route, owner, s.organizationId, { logoFileId: id })).statusCode, 404);
  const update = await call('PATCH', route, owner, s.organizationId, { logoFileId: logo, coverFileId: cover }); assert.equal(update.statusCode, 200, update.body);
  assert.equal((await call('GET', `organizations/${s.organizationId}`, owner, s.organizationId)).json().branding.logoFileId, logo);
  assert.equal((await call('PATCH', route, owner, s.organizationId, { logoFileId: null })).statusCode, 200);
});

test('stale scopes are revalidated before writes and cursor filters never escape tenant/branch scope', async () => {
  const owner = await actor(); const manager = await actor(); const s = await shop(owner); const joined = await join(owner, s, manager, 'ADMIN');
  const scope = await app.get(TenantAuthorization).resolve(manager.id, s.organizationId, undefined, ['BRANCH_MANAGE']);
  assert.equal((await call('PATCH', `organizations/${s.organizationId}/memberships/${joined.membershipId}`, owner, s.organizationId, { status: 'REVOKED', roleIds: [], branchAccess: 'ALL', branchIds: [] })).statusCode, 200);
  await assert.rejects(app.get(Organizations).createBranch(scope, { userId: manager.id, credentialId: manager.sessionId }, { code: 'STALE', name: 'Denied' }, randomUUID(), randomUUID()));
  await branch(owner, s); await branch(owner, s);
  const seen = new Set<string>(); let cursor: string | null = null;
  do {
    const r = await call('GET', `organizations/${s.organizationId}/branches?limit=1${cursor ? `&cursor=${cursor}` : ''}`, owner, s.organizationId);
    assert.equal(r.statusCode, 200); const body = r.json();
    for (const item of body.items) { assert.equal(item.organizationId, s.organizationId); assert.ok(!seen.has(item.id)); seen.add(item.id); }
    cursor = body.nextCursor;
  } while (cursor);
  assert.equal(seen.size, 3);
});

test('database constraints protect invitation identity, terminal state, financial settings and retained branches', async () => {
  const owner = await actor(); const member = await actor(); const s = await shop(owner); const rolesHere = await roles(owner, s);
  const invitation = await offer(owner, s, member, [rolesHere[0].id]);
  assert.equal((await call('POST', `organizations/${s.organizationId}/invitations/${invitation.id}/revoke`, owner, s.organizationId)).statusCode, 200);
  await assert.rejects(store.db.membershipInvitation.update({ where: { id: invitation.id }, data: { status: 'PENDING' } }));
  await assert.rejects(store.db.membershipInvitation.update({ where: { id: invitation.id }, data: { destination: owner.contact } }));
  await assert.rejects(store.db.organization.update({ where: { id: s.organizationId }, data: { currency: 'USD' } }));
  await assert.rejects(store.db.branch.update({ where: { id: s.branchId }, data: { archivedAt: new Date() } }));
  await assert.rejects(store.db.membershipInvitation.delete({ where: { id: invitation.id } }));
  await assert.rejects(store.db.organizationCreation.deleteMany({ where: { organizationId: s.organizationId } }));
  const other = await shop(owner); const foreignRole = (await roles(owner, other))[0];
  await assert.rejects(store.db.membershipInvitation.create({ data: { organizationId: s.organizationId, invitedByUserId: owner.id, channel: 'EMAIL', destination: newEmail(), roleIds: [foreignRole.id], branchAccess: 'ALL', branchIds: [], expiresAt: new Date(Date.now() + 3600_000) } }));
});


test('database sessions and generated timestamps use actual UTC instants, independent of server timezone', async () => {
  const [setting] = await store.db.$queryRaw<Array<{ zone: string; epoch: number }>>`SELECT current_setting('TimeZone') AS zone, extract(epoch FROM clock_timestamp())::double precision AS epoch`;
  assert.equal(setting.zone, 'UTC');
  assert.ok(Math.abs(setting.epoch * 1000 - Date.now()) < 5000);
  const owner = await actor();
  const user = await store.db.user.findUniqueOrThrow({ where: { id: owner.id } });
  const session = await store.db.authSession.findUniqueOrThrow({ where: { id: owner.sessionId } });
  assert.ok(Math.abs(user.createdAt.getTime() - Date.now()) < 5000);
  assert.ok(Math.abs(session.createdAt.getTime() - Date.now()) < 5000);
  const [expiry] = await store.db.$queryRaw<Array<{ live: boolean }>>`SELECT "accessExpiresAt" > now() AND "expiresAt" > now() AS live FROM auth_sessions WHERE id=${session.id}::uuid`;
  assert.equal(expiry.live, true);
});


test('competing ownership transfers cannot both commit or leave multiple new owners', async () => {
  const owner = await actor(); const first = await actor(); const second = await actor(); const s = await shop(owner);
  const a = await join(owner, s, first); const b = await join(owner, s, second);
  const responses = await Promise.all([a, b].map((target) => call('POST', `organizations/${s.organizationId}/ownership/transfer`, owner, s.organizationId, { membershipId: target.membershipId, previousOwnerRoleIds: [] })));
  assert.deepEqual(responses.map((r) => r.statusCode).sort(), [200, 403]);
  assert.equal(await store.db.membership.count({ where: { organizationId: s.organizationId, isOwner: true, status: 'ACTIVE' } }), 1);
  assert.equal(await store.db.auditEvent.count({ where: { organizationId: s.organizationId, action: 'OWNERSHIP_TRANSFERRED' } }), 1);
});

test('ownership transfer requires a recently established session even when the access token is valid', async () => {
  let owner = await actor(); const next = await actor();
  const token = randomBytes(32).toString('base64url');
  const old = await store.db.authSession.create({ data: { userId: owner.id, clientKind: 'MOBILE', deviceName: 'Old session',
    accessHash: createHash('sha256').update(token).digest('hex'), csrfHash: 'a'.repeat(64), createdAt: new Date(Date.now() - 11 * 60_000),
    accessExpiresAt: new Date(Date.now() + 10 * 60_000), expiresAt: new Date(Date.now() + 24 * 3600_000) } });
  owner = { ...owner, accessToken: token, sessionId: old.id };
  const s = await shop(owner); const joined = await join(owner, s, next);
  assert.equal((await context(owner, s)).statusCode, 200);
  const response = await call('POST', `organizations/${s.organizationId}/ownership/transfer`, owner, s.organizationId, { membershipId: joined.membershipId, previousOwnerRoleIds: [] });
  assert.equal(response.statusCode, 401, response.body);
  assert.equal((await context(owner, s)).json().isOwner, true);
});
