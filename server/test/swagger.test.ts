import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'node:test';

for (const mode of ['development', 'production', 'test']) {
  test(`Swagger routes are ${mode === 'development' ? 'available' : 'disabled'} in ${mode}`, () => {
    // Each process loads ConfigModule with its own mode and explicit settings.
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const { createApp } = require('./dist-test/src/app');
      (async () => {
        const app = await createApp();
        try {
          await app.init();
          const enabled = process.env.NODE_ENV === 'development';
          for (const url of ['/api-docs', '/api-docs-json', '/api-docs-yaml', '/api-docs/swagger-ui.css']) {
            const response = await app.inject({ method: 'GET', url });
            assert.equal(response.statusCode, enabled ? 200 : 404, url);
            if (enabled && url === '/api-docs-json') {
              assert.equal(response.json().info.title, 'Core Shop API');
              assert.ok(response.json().paths['/health'].get);
            }
            if (enabled && url === '/api-docs') assert.match(response.body, /Swagger UI/);
          }
        } finally {
          await app.close();
        }
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `], {
      cwd: resolve(__dirname, '../..'),
      env: { ...process.env, NODE_ENV: mode, HOST: '127.0.0.1', PORT: '3000', CORS_ORIGINS: '' },
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
}
