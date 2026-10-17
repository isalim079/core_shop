import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { after, before, test } from 'node:test';
import { createRequire } from 'node:module';
// Load Nest's tsc output: tsx does not emit constructor/DTO decorator metadata.
const loadCompiled = createRequire(__filename);
const { createApp } = loadCompiled('../../dist/app') as typeof import('../../src/app');
const { AuthStore } = loadCompiled('../../dist/auth/auth-store.service') as typeof import('../../src/auth/auth-store.service');
const { GoogleTokens } = loadCompiled('../../dist/auth/google.service') as typeof import('../../src/auth/google.service');
import type { VerificationDelivery } from '../../src/auth/delivery.service';
const { VerificationDeliveryService } = loadCompiled('../../dist/auth/delivery.service') as typeof import('../../src/auth/delivery.service');

const target = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !target.pathname.startsWith('/core_shop_test_')) throw new Error('Auth tests require a disposable local database.');
let app: Awaited<ReturnType<typeof createApp>>;
let store: InstanceType<typeof AuthStore>;
const sent: VerificationDelivery[] = [];
const password = 'ভালো password for a real shop 123!';
let ip = 0;
const nextIp = () => `198.18.${Math.floor(++ip / 250)}.${ip % 250 + 1}`;
const email = () => `${randomUUID()}@example.test`;
function request(url: string, payload?: object, token?: string, method = 'POST', headers: Record<string, string> = {}, remoteAddress = nextIp()) {
  return app.inject({ url: `/api/v1/auth/${url}`, method: method as 'POST', ...(payload ? { payload } : {}), remoteAddress,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } });
}
async function code(contact: string, purpose = 'registration', channel = 'EMAIL') {
  const response = await request(`${purpose}/request`, { channel, contact });
  assert.equal(response.statusCode, 201, response.body);
  return { challengeId: response.json().challengeId as string, code: sent.at(-1)!.code };
}
async function register(contact = email(), channel = 'EMAIL') {
  const proof = await code(contact, 'registration', channel);
  const response = await request('registration/complete', { ...proof, password, displayName: 'রহিমের দোকান', preferredLanguage: 'bn' });
  assert.equal(response.statusCode, 201, response.body);
  return { contact, channel };
}
async function login(account: { contact: string; channel: string }, extraPassword = password) {
  const response = await request('mobile/login', { ...account, password: extraPassword, deviceName: 'Integration test' });
  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}

before(async () => {
  app = await createApp();
  await app.init();
  store = app.get(AuthStore);
  const delivery = app.get(VerificationDeliveryService);
  delivery.assertAvailable = () => undefined;
  delivery.send = async (message) => { sent.push(message); };
});
after(async () => { await app?.close(); });

test('verified email registration, password login, private profile and session disclosure boundaries', async () => {
  const destination = email();
  const proof = await code(destination);
  assert.equal(await store.db.user.findUnique({ where: { email: destination } }), null);
  const challenge = await store.db.authChallenge.findUniqueOrThrow({ where: { id: proof.challengeId } });
  assert.notEqual(challenge.secretHash, proof.code);
  assert.match(challenge.secretHash, /^[a-f0-9]{64}$/);
  assert.equal((await request('registration/complete', { ...proof, password, displayName: 'দোকান', preferredLanguage: 'bn' })).statusCode, 201);
  const user = await store.db.user.findUniqueOrThrow({ where: { email: destination } });
  assert.equal(user.status, 'ACTIVE'); assert.ok(user.emailVerifiedAt); assert.match(user.passwordHash!, /^\$argon2id\$/);
  const tokens = await login({ contact: destination.toUpperCase(), channel: 'EMAIL' });
  const me = await request('me', undefined, tokens.accessToken, 'GET');
  assert.equal(me.statusCode, 200); assert.equal(me.json().preferredLanguage, 'bn'); assert.equal(me.json().passwordHash, undefined);
  const session = await store.db.authSession.findUniqueOrThrow({ where: { id: tokens.sessionId } });
  assert.notEqual(session.accessHash, tokens.accessToken);
  const listed = await request('sessions', undefined, tokens.accessToken, 'GET');
  assert.equal(listed.statusCode, 200); assert.equal(listed.json()[0].id, tokens.sessionId); assert.equal(listed.json()[0].accessHash, undefined);
  assert.equal((await request('registration/complete', { ...proof, password, displayName: 'Replay' })).statusCode, 401);
});

test('phone verification and authenticated linking allow both contact login methods on one account', async () => {
  const phone = `+88017${Date.now().toString().slice(-8)}`;
  const account = await register(phone, 'PHONE');
  const tokens = await login(account);
  const destination = email();
  const response = await request('contacts/request', { channel: 'EMAIL', contact: destination }, tokens.accessToken);
  assert.equal(response.statusCode, 201);
  assert.equal((await request('contacts/complete', { challengeId: response.json().challengeId, code: sent.at(-1)!.code }, tokens.accessToken)).statusCode, 201);
  const otherTokens = await login({ channel: 'EMAIL', contact: destination });
  assert.equal((await request('me', undefined, otherTokens.accessToken, 'GET')).json().phone, phone);
  const invalid = await request('registration/request', { channel: 'PHONE', contact: '01712345678' });
  assert.equal(invalid.statusCode, 400);
  const recovery = await code(phone, 'password/reset', 'PHONE');
  const changed = 'phone recovery password 789!';
  assert.equal((await request('password/reset/complete', { ...recovery, password: changed })).statusCode, 201);
  await login(account, changed);
});

test('verification attempts, expiry, purpose and ownership are enforced transactionally', async () => {
  const destination = email(); const proof = await code(destination);
  const wrong = proof.code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await request('registration/complete', { ...proof, code: wrong, password, displayName: 'Test' })).statusCode, 401);
  assert.equal((await request('registration/complete', { ...proof, password, displayName: 'Test' })).statusCode, 401);
  const expired = await code(email());
  await store.db.authChallenge.update({ where: { id: expired.challengeId }, data: { expiresAt: new Date(0) } });
  assert.equal((await request('registration/complete', { ...expired, password, displayName: 'Test' })).statusCode, 401);
  const mismatch = await code(email());
  assert.equal((await request('password/reset/complete', { ...mismatch, password })).statusCode, 401);
  const existing = await register();
  const duplicate = await code(existing.contact);
  assert.equal((await request('registration/complete', { ...duplicate, password, displayName: 'Attacker' })).statusCode, 401);
});

test('password reset is single-use, revokes sessions, and supports phone recovery', async () => {
  const account = await register(); const tokens = await login(account);
  const proof = await code(account.contact, 'password/reset');
  const replacement = 'replacement password with 22 chars!';
  assert.equal((await request('password/reset/complete', { ...proof, password: replacement })).statusCode, 201);
  assert.equal((await request('me', undefined, tokens.accessToken, 'GET')).statusCode, 401);
  assert.equal((await request('mobile/refresh', { refreshToken: tokens.refreshToken })).statusCode, 401);
  assert.equal((await request('mobile/login', { ...account, password, deviceName: 'old' })).statusCode, 401);
  await login(account, replacement);
  assert.equal((await request('password/reset/complete', { ...proof, password: replacement })).statusCode, 401);
  const unknown = await code(email(), 'password/reset');
  assert.equal((await request('password/reset/complete', { ...unknown, password: replacement })).statusCode, 401);
});

test('refresh rotates credentials and replay revocation commits before rejection', async () => {
  const tokens = await login(await register());
  const response = await request('mobile/refresh', { refreshToken: tokens.refreshToken });
  assert.equal(response.statusCode, 201, response.body);
  const rotated = response.json(); assert.notEqual(rotated.refreshToken, tokens.refreshToken);
  assert.equal((await request('me', undefined, tokens.accessToken, 'GET')).statusCode, 401);
  assert.equal((await request('me', undefined, rotated.accessToken, 'GET')).statusCode, 200);
  assert.equal((await request('mobile/refresh', { refreshToken: tokens.refreshToken })).statusCode, 401);
  assert.equal((await request('me', undefined, rotated.accessToken, 'GET')).statusCode, 401);
  assert.ok((await store.db.authSession.findUniqueOrThrow({ where: { id: tokens.sessionId } })).revokedAt);
});

test('concurrent refresh reuse cannot leave an active compromised family', async () => {
  const tokens = await login(await register());
  const results = await Promise.all([request('mobile/refresh', { refreshToken: tokens.refreshToken }), request('mobile/refresh', { refreshToken: tokens.refreshToken })]);
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [201, 401]);
  const success = results.find((r) => r.statusCode === 201)!;
  assert.equal((await request('me', undefined, success.json().accessToken, 'GET')).statusCode, 401);
});

test('web sessions use HttpOnly cookies, exact origins and CSRF; mobile tokens are not browser login transport', async () => {
  const account = await register(); const payload = { ...account, password, deviceName: 'Browser' };
  assert.equal((await request('web/login', payload)).statusCode, 403);
  assert.equal((await request('web/login', payload, undefined, 'POST', { origin: 'https://evil.example' })).statusCode, 403);
  assert.equal((await request('mobile/login', payload, undefined, 'POST', { origin: 'http://localhost:5173' })).statusCode, 403);
  const response = await request('web/login', payload, undefined, 'POST', { origin: 'http://localhost:5173' });
  assert.equal(response.statusCode, 201, response.body);
  assert.equal(response.json().accessToken, undefined); assert.equal(response.json().refreshToken, undefined);
  const cookies = response.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  assert.equal(response.cookies.length, 2);
  for (const c of response.cookies) { assert.equal(c.httpOnly, true); assert.equal(c.sameSite, 'Lax'); }
  assert.equal((await request('me', undefined, undefined, 'GET', { cookie: cookies })).statusCode, 200);
  assert.equal((await request('me', { displayName: 'Updated' }, undefined, 'PATCH', { cookie: cookies, origin: 'http://localhost:5173' })).statusCode, 403);
  const headers = { cookie: cookies, origin: 'http://localhost:5173', 'x-csrf-token': response.json().csrfToken };
  assert.equal((await request('me', { displayName: 'Updated' }, undefined, 'PATCH', headers)).statusCode, 200);
  assert.equal((await request('web/refresh', {}, undefined, 'POST', { cookie: cookies, origin: 'http://localhost:5173' })).statusCode, 401);
  const bootstrap = await request('web/csrf', {}, undefined, 'POST', { cookie: cookies, origin: 'http://localhost:5173' });
  assert.equal(bootstrap.statusCode, 201);
  assert.equal((await request('web/csrf', {}, undefined, 'POST', { cookie: cookies, origin: 'https://evil.example' })).statusCode, 403);
  headers['x-csrf-token'] = bootstrap.json().csrfToken;
  assert.equal((await request('web/refresh', {}, undefined, 'POST', headers)).statusCode, 201);
});

test('revocation, suspension and session expiration invalidate bearer authentication', async () => {
  const account = await register(); const first = await login(account); const second = await login(account);
  const unrelated = await login(await register());
  assert.equal((await request(`sessions/${second.sessionId}`, undefined, unrelated.accessToken, 'DELETE')).statusCode, 200);
  assert.equal((await request('me', undefined, second.accessToken, 'GET')).statusCode, 200);
  assert.equal((await request(`sessions/${second.sessionId}`, undefined, first.accessToken, 'DELETE')).statusCode, 200);
  assert.equal((await request('me', undefined, second.accessToken, 'GET')).statusCode, 401);
  await store.db.authSession.update({ where: { id: first.sessionId }, data: { accessExpiresAt: new Date(0) } });
  assert.equal((await request('me', undefined, first.accessToken, 'GET')).statusCode, 401);
  const third = await login(account);
  const session = await store.db.authSession.findUniqueOrThrow({ where: { id: third.sessionId } });
  await store.db.user.update({ where: { id: session.userId }, data: { status: 'SUSPENDED' } });
  assert.equal((await request('me', undefined, third.accessToken, 'GET')).statusCode, 401);
  assert.equal((await request('mobile/refresh', { refreshToken: third.refreshToken })).statusCode, 401);
  const activeAccount = await register(); const active = await login(activeAccount);
  const activeSession = await store.db.authSession.findUniqueOrThrow({ where: { id: active.sessionId } });
  const expiredRefresh = randomBytes(32).toString('base64url');
  await store.db.authSession.create({ data: { userId: activeSession.userId, clientKind: 'MOBILE', deviceName: 'expired fixture', accessHash: 'a'.repeat(64), csrfHash: 'b'.repeat(64),
    createdAt: new Date(Date.now() - 7200_000), accessExpiresAt: new Date(Date.now() - 3600_000), expiresAt: new Date(Date.now() - 1800_000),
    refreshTokens: { create: { tokenHash: createHash('sha256').update(expiredRefresh).digest('hex') } } } });
  assert.equal((await request('mobile/refresh', { refreshToken: expiredRefresh })).statusCode, 401);
});

test('account rate limits survive changing client IPs and persisted counters do not disclose destinations', async () => {
  const contact = email();
  for (let i = 0; i < 8; i++) assert.equal((await request('mobile/login', { channel: 'EMAIL', contact, password, deviceName: 'attack' })).statusCode, 401);
  assert.equal((await request('mobile/login', { channel: 'EMAIL', contact, password, deviceName: 'attack' })).statusCode, 429);
  const buckets = await store.db.authRateBucket.findMany({ take: 5 });
  assert.ok(buckets.every((b) => /^[a-f0-9]{64}$/.test(b.key)));
  const registered = await register();
  const row = await store.db.user.findUniqueOrThrow({ where: { email: registered.contact } });
  const unverified = email();
  await store.db.user.create({ data: { email: unverified, passwordHash: row.passwordHash, status: 'ACTIVE', displayName: 'Unverified fixture' } });
  assert.equal((await request('mobile/login', { channel: 'EMAIL', contact: unverified, password, deviceName: 'test' })).statusCode, 401);
  const events = await store.db.auditEvent.findMany({ where: { action: 'AUTH_LOGIN_FAILED' }, take: 10 });
  assert.ok(events.length); assert.ok(events.every((event) => JSON.stringify(event.metadata) === '{}'));
});

test('Google rejects untrusted ID tokens, requires nonce, prevents replay and never merges by matching email', async () => {
  const google = app.get(GoogleTokens);
  await assert.rejects(google.verify('invalid-token-with-no-signature'));
  // Provider boundary stub only: production always uses Google's signature/audience/issuer/expiry verifier.
  const realVerify = google.verify.bind(google);
  google.verify = async (token: string) => JSON.parse(Buffer.from(token, 'base64url').toString()) as Awaited<ReturnType<InstanceType<typeof GoogleTokens>['verify']>>;
  try {
    async function googleInput(destination: string, subject = randomUUID(), nonceOverride?: string) {
      const challenge = await request('google/challenge'); assert.equal(challenge.statusCode, 201);
      return { challengeId: challenge.json().challengeId, deviceName: 'Google device',
        idToken: Buffer.from(JSON.stringify({ email: destination, subject, nonce: nonceOverride ?? challenge.json().nonce, authoritative: true })).toString('base64url') };
    }
    const destination = email(); const subject = randomUUID();
    const proof = await googleInput(destination, subject);
    const response = await request('mobile/google', proof); assert.equal(response.statusCode, 201, response.body);
    assert.equal((await request('mobile/google', proof)).statusCode, 401);
    const wrong = await googleInput(destination, subject, 'wrong-nonce');
    assert.equal((await request('mobile/google', wrong)).statusCode, 401);
    const existing = await register(); const collision = await googleInput(existing.contact);
    assert.equal((await request('mobile/google', collision)).statusCode, 401);
    const authenticated = await login(existing);
    const link = await googleInput(existing.contact);
    assert.equal((await request('mobile/google/link', link, authenticated.accessToken)).statusCode, 201);
    const linked = await store.db.googleIdentity.findUniqueOrThrow({ where: { subject: JSON.parse(Buffer.from(link.idToken, 'base64url').toString()).subject } });
    const me = (await request('me', undefined, authenticated.accessToken, 'GET')).json(); assert.equal(linked.userId, me.id);
    assert.equal((await request('mobile/google', await googleInput(destination, subject))).statusCode, 201);
  } finally { google.verify = realVerify; }
});

test('delivery failures fail closed and invalidate the generated challenge without exposing a code', async () => {
  const delivery = app.get(VerificationDeliveryService); const realSend = delivery.send;
  delivery.send = async () => { throw new Error('provider password DO_NOT_DISCLOSE'); };
  try {
    const destination = email(); const response = await request('registration/request', { channel: 'EMAIL', contact: destination });
    assert.equal(response.statusCode, 503); assert.ok(!response.body.includes('DO_NOT_DISCLOSE'));
    const challenge = await store.db.authChallenge.findFirstOrThrow({ where: { destination } }); assert.ok(challenge.consumedAt);
  } finally { delivery.send = realSend; }
});


test('database prevents resurrection of revoked/consumed credentials and replacement of Google identity', async () => {
  const account = await register(); const tokens = await login(account);
  assert.equal((await request('logout', {}, tokens.accessToken)).statusCode, 201);
  await assert.rejects(store.db.authSession.update({ where: { id: tokens.sessionId }, data: { revokedAt: null } }));
  const refreshed = await login(account);
  assert.equal((await request('mobile/refresh', { refreshToken: refreshed.refreshToken })).statusCode, 201);
  const used = await store.db.authRefreshToken.findFirstOrThrow({ where: { sessionId: refreshed.sessionId, usedAt: { not: null } } });
  await assert.rejects(store.db.authRefreshToken.update({ where: { id: used.id }, data: { usedAt: null } }));
  const consumed = await store.db.authChallenge.findFirstOrThrow({ where: { destination: account.contact, purpose: 'REGISTER' } });
  await assert.rejects(store.db.authChallenge.update({ where: { id: consumed.id }, data: { consumedAt: null } }));
  await assert.rejects(store.db.authChallenge.update({ where: { id: consumed.id }, data: { secretHash: 'f'.repeat(64) } }));
  const google = await store.db.googleIdentity.findFirstOrThrow();
  await assert.rejects(store.db.googleIdentity.update({ where: { id: google.id }, data: { subject: randomUUID() } }));
  await assert.rejects(store.db.authSession.delete({ where: { id: refreshed.sessionId } }));
});
