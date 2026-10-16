import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { environmentFiles, validateEnvironment } from '../src/config/environment';

test('production and tests cannot fall back to local environment files', () => {
  assert.deepEqual(environmentFiles('development'), ['.env.local']);
  assert.deepEqual(environmentFiles('production'), ['.env.production']);
  assert.deepEqual(environmentFiles('test'), []);
  assert.throws(() => environmentFiles('unexpected'));
});

test('configuration rejects invalid ports without exposing their values', () => {
  for (const port of ['secret-value', '0', '65536', '1.5', '']) {
    assert.throws(() => validateEnvironment({ PORT: port }), { message: 'Invalid environment configuration: PORT' });
  }
});

test('connection URLs allow empty settings and validate protocols without exposing credentials', () => {
  const empty = validateEnvironment({});
  assert.equal(empty.DATABASE_URL, '');
  assert.equal(empty.REDIS_URL, '');
  const connections = {
    DATABASE_URL: 'postgresql://app:secret@127.0.0.1:5432/core_shop',
    REDIS_URL: 'rediss://default:secret@redis.example.com:6379/0',
  };
  const config = validateEnvironment(connections);
  assert.equal(config.DATABASE_URL, connections.DATABASE_URL);
  assert.equal(config.REDIS_URL, connections.REDIS_URL);
  for (const field of ['DATABASE_URL', 'REDIS_URL']) {
    for (const value of ['secret-value', 'https://user:secret@example.com']) {
      assert.throws(() => validateEnvironment({ [field]: value }), {
        message: `Invalid environment configuration: ${field}`,
      });
    }
  }
});

test('CORS accepts exact origins and requires HTTPS in production', () => {
  assert.deepEqual(validateEnvironment({ CORS_ORIGINS: 'http://localhost:5173, https://shop.example.com' }).CORS_ORIGINS,
    ['http://localhost:5173', 'https://shop.example.com']);
  for (const origin of ['*', 'https://example.com/path', 'https://user:pass@example.com', 'ftp://example.com']) {
    assert.throws(() => validateEnvironment({ CORS_ORIGINS: origin }));
  }
  assert.throws(() => validateEnvironment({ NODE_ENV: 'production', CORS_ORIGINS: 'http://localhost:5173' }));
});
