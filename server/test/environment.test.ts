import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { environmentFiles, validateEnvironment } from '../src/common/config/environment';

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

test('CORS accepts exact origins and requires HTTPS in production', () => {
  assert.deepEqual(validateEnvironment({ CORS_ORIGINS: 'http://localhost:5173, https://shop.example.com' }).CORS_ORIGINS,
    ['http://localhost:5173', 'https://shop.example.com']);
  for (const origin of ['*', 'https://example.com/path', 'https://user:pass@example.com', 'ftp://example.com']) {
    assert.throws(() => validateEnvironment({ CORS_ORIGINS: origin }));
  }
  assert.throws(() => validateEnvironment({ NODE_ENV: 'production', CORS_ORIGINS: 'http://localhost:5173' }));
});
