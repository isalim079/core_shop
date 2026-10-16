import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

function scenario(script: string, env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const { createFixture } = require('./dist-test/test/support/http-fixture');
    (async () => {
      const app = await createFixture();
      try { await app.init(); ${script} } finally { await app.close(); }
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], {
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', MIGRATION_DATABASE_URL: '', REDIS_URL: '',
      LOG_LEVEL: 'silent', RATE_LIMIT_MAX: '120', TRUST_PROXY_CIDRS: '',
      R2_ACCOUNT_ID: '', R2_BUCKET_NAME: '', R2_ACCESS_KEY_ID: '', R2_SECRET_ACCESS_KEY: '',
      CORS_ORIGINS: 'http://localhost:5173', ...env },
    encoding: 'utf8', timeout: 30_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(!result.stdout.includes('DO_NOT_DISCLOSE'));
}

test('global validation rejects unknown fields, malformed JSON, bad pagination and preserves Unicode', () => scenario(`
  const valid = await app.inject({method:'POST',url:'/api/v1/__test/validation',payload:{displayName:'মোঃ রহিম',amount:'100.25'}});
  assert.equal(valid.statusCode,201);
  assert.equal(valid.json().displayName,'মোঃ রহিম');
  for (const payload of [{displayName:'A',amount:100}, {displayName:'A',amount:'1',organizationId:'spoof'}, {displayName:null,amount:'1'}]) {
    const response=await app.inject({method:'POST',url:'/api/v1/__test/validation',payload});
    assert.equal(response.statusCode,400);
    assert.equal(response.json().error.code,'VALIDATION_FAILED');
    assert.ok(response.json().error.fields.length);
  }
  for (const query of ['limit=101','limit=0','limit=1.5','limit=0x10','limit=1&limit=2','sortBy=password','cursor=not-valid-json']) {
    assert.equal((await app.inject({method:'GET',url:'/api/v1/__test/list?'+query})).statusCode,400,query);
  }
  const page=await app.inject({method:'GET',url:'/api/v1/__test/list?limit=25&direction=asc'});
  assert.equal(page.statusCode,200); assert.equal(page.json().limit,25);
  const malformed=await app.inject({method:'POST',url:'/api/v1/__test/validation',headers:{'content-type':'application/json'},payload:'{bad'});
  assert.equal(malformed.statusCode,400);assert.equal(malformed.json().error.code,'BAD_REQUEST');
  const large=await app.inject({method:'POST',url:'/api/v1/__test/validation',headers:{'content-type':'application/json'},payload:JSON.stringify({text:'x'.repeat(1024*1024)})});
  assert.equal(large.statusCode,413); assert.equal(large.json().error.code,'PAYLOAD_TOO_LARGE');
`));

test('safe English/Bangla errors and server-generated correlation IDs do not reveal internals', () => scenario(`
  const response=await app.inject({method:'GET',url:'/api/v1/__test/explode?token=DO_NOT_DISCLOSE',headers:{'x-request-id':'spoofed','accept-language':'bn-BD'}});
  assert.equal(response.statusCode,500);
  assert.equal(response.json().error.code,'INTERNAL_ERROR');
  assert.match(response.json().error.message,/[\u0980-\u09ff]/);
  assert.equal(response.headers['content-language'],'bn');
  assert.equal(response.json().error.requestId,response.headers['x-request-id']);
  assert.match(response.headers['x-request-id'],/^[0-9a-f-]{36}$/);
  assert.notEqual(response.headers['x-request-id'],'spoofed');
  assert.ok(!response.body.includes('DO_NOT_DISCLOSE'));assert.ok(!response.body.includes('SELECT'));
  const business=await app.inject({method:'GET',url:'/api/v1/__test/business-error',headers:{'accept-language':'bn'}});
  assert.equal(business.statusCode,422);assert.equal(business.json().error.code,'PAYMENT_EXCEEDS_OUTSTANDING');
  const privateRoute=await app.inject({method:'GET',url:'/api/v1/__test/private',headers:{'x-user-id':'spoofed','x-organization-id':'spoofed','authorization':'Bearer fake'}});
  assert.equal(privateRoute.statusCode,401); assert.equal(privateRoute.json().error.code,'UNAUTHENTICATED');
`, { LOG_LEVEL: 'info' }));

test('security headers and explicit CORS apply to successes and errors', () => scenario(`
  for(const url of ['/health','/unknown']) {
    const response=await app.inject({method:'GET',url,headers:{origin:'http://localhost:5173'}});
    assert.equal(response.headers['x-content-type-options'],'nosniff');
    assert.ok(response.headers['content-security-policy']);assert.equal(response.headers['referrer-policy'],'no-referrer');
    assert.equal(response.headers['access-control-allow-origin'],'http://localhost:5173');
    assert.equal(response.headers['access-control-allow-credentials'],undefined);
    assert.match(response.headers.vary,/Accept-Language/i);assert.match(response.headers.vary,/Origin/i);
  }
  const disallowed=await app.inject({method:'GET',url:'/health',headers:{origin:'https://untrusted.example'}});
  assert.equal(disallowed.headers['access-control-allow-origin'],undefined);
`));

test('rate limiting covers unknown routes and ignores forwarded IP spoofing by default', () => scenario(`
  for(let i=0;i<2;i++) assert.equal((await app.inject({method:'GET',url:'/unknown-'+i,headers:{'x-forwarded-for':'203.0.113.'+(i+1)}})).statusCode,404);
  const blocked=await app.inject({method:'GET',url:'/health',headers:{'x-forwarded-for':'203.0.113.99'}});
  assert.equal(blocked.statusCode,429);assert.equal(blocked.json().error.code,'RATE_LIMITED');
  assert.ok(Number(blocked.headers['retry-after'])>0);assert.equal(blocked.json().error.requestId,blocked.headers['x-request-id']);
`, { RATE_LIMIT_MAX: '2' }));

test('forwarded IPs are used only behind explicitly trusted proxies', () => scenario(`
  for(const ip of ['203.0.113.1','203.0.113.2']) assert.equal((await app.inject({method:'GET',url:'/health',headers:{'x-forwarded-for':ip}})).statusCode,200);
  assert.equal((await app.inject({method:'GET',url:'/health',headers:{'x-forwarded-for':'203.0.113.1'}})).statusCode,429);
`, { RATE_LIMIT_MAX: '1', TRUST_PROXY_CIDRS: '127.0.0.1/32' }));
