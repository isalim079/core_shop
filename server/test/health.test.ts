import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('health is public liveness only; unknown API routes stay unavailable', async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = '';
  // Import after selecting test mode so no real environment file is loaded.
  const { createApp } = await import('../src/app');
  const app = await createApp();
  try {
    await app.init();
    const response = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok', service: 'core-shop-server' });
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/products' })).statusCode, 404);
    const readiness = await app.inject({ method: 'GET', url: '/ready' });
    assert.equal(readiness.statusCode, 503);
    assert.equal(readiness.json().error.code, 'SERVICE_UNAVAILABLE');
    assert.equal(readiness.json().error.requestId, readiness.headers['x-request-id']);
  } finally {
    await app.close();
  }
});
