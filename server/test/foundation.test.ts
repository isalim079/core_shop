import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { payloadHash } from '../src/common/commands/canonical-payload';
import { createLogger } from '../src/common/logging/logger';
import { negotiateLocale } from '../src/localization/errors';
import { validateEnvironment } from '../src/config/environment';
import { r2Configuration } from '../src/config/storage';
import { verifiedObjectKey } from '../src/files/file-policy';

test('canonical command hashes ignore object order and reject ambiguous/non-JSON values', () => {
  assert.equal(payloadHash({ a: '100.00', b: [1, 'বাংলা'] }), payloadHash({ b: [1, 'বাংলা'], a: '100.00' }));
  assert.notEqual(payloadHash({ amount: '100' }), payloadHash({ amount: '101' }));
  for (const value of [Number.NaN, 1.25, undefined, new Date(), { a: undefined }]) assert.throws(() => payloadHash(value));
  assert.throws(() => payloadHash(JSON.parse('{"__proto__":{}}')));
});

test('structured logger drops raw requests/errors and redacts credential fields', () => {
  let output = '';
  const stream = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
  const logger = createLogger('info', stream);
  logger.error({ event: 'request_failed', authorization: 'secret-auth', token: 'secret-token', DATABASE_URL: 'secret-url',
    req: { body: 'secret-body', headers: { cookie: 'secret-cookie' } }, err: new Error('secret-stack') });
  for (const secret of ['secret-auth', 'secret-token', 'secret-url', 'secret-body', 'secret-cookie', 'secret-stack']) assert.ok(!output.includes(secret));
  assert.equal(JSON.parse(output).event, 'request_failed');
});

test('locale negotiation is bounded, respects quality and keeps English fallback', () => {
  assert.equal(negotiateLocale('en;q=0.2,bn-BD;q=0.9'), 'bn');
  assert.equal(negotiateLocale('bn;q=0,en;q=1'), 'en');
  assert.equal(negotiateLocale('fr,xx'), 'en');
});

test('R2 settings are optional as a group and verified keys differ from upload keys', () => {
  assert.equal(r2Configuration(validateEnvironment({})), null);
  assert.throws(() => validateEnvironment({ R2_ACCOUNT_ID: 'a'.repeat(32) }));
  assert.throws(() => validateEnvironment({ TRUST_PROXY_CIDRS: 'true' }));
  const config = validateEnvironment({ R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET_NAME: 'private-assets', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test' });
  assert.equal(r2Configuration(config)?.endpoint, `https://${'a'.repeat(32)}.r2.cloudflarestorage.com`);
  const id = randomUUID(); const fileId = randomUUID();
  assert.equal(verifiedObjectKey({ organizationId: id }, fileId, 'a'.repeat(64)), `organizations/${id}/${fileId}/verified/${'a'.repeat(64)}`);
});
