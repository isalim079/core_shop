import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { Pool, PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from '../../src/config/environment';
import { DatabaseService } from '../../src/database/database.service';
import { TenantAuthorization } from '../../src/common/guards/tenant-authorization';
import { AuditService } from '../../src/audit/audit.service';
import { CommandService } from '../../src/common/commands/command.service';
import { DomainError } from '../../src/common/errors/domain-error';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL must point to a migrated disposable local database.');
const target = new URL(url);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !target.pathname.startsWith('/core_shop_test_')) {
  throw new Error('Integration tests require a local core_shop_test_* database.');
}
const pool = new Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 2000, statement_timeout: 5000 });
after(async () => { await pool.end(); });

async function rollbackTest(run: (client: PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await run(client);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

async function rejectsSql(client: PoolClient, sql: string, params: unknown[], code = '23514') {
  await client.query('SAVEPOINT rejected_write');
  try {
    await assert.rejects(client.query(sql, params), (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === code);
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT rejected_write');
  }
}

async function fixture(client: PoolClient) {
  const user = randomUUID();
  const organization = randomUUID();
  const membership = randomUUID();
  await client.query('INSERT INTO users (id,email,"displayName","updatedAt") VALUES ($1,$2,$3,now())',
    [user, `${user}@example.test`, 'Test owner']);
  await client.query('INSERT INTO organizations (id,name,currency,timezone,"updatedAt") VALUES ($1,$2,$3,$4,now())',
    [organization, 'Test shop', 'BDT', 'Asia/Dhaka']);
  await client.query('INSERT INTO memberships (id,"organizationId","userId","isOwner","branchAccess","updatedAt") VALUES ($1,$2,$3,true,\'ALL\',now())',
    [membership, organization, user]);
  return { user, organization, membership };
}

async function file(client: PoolClient, owner: string, uploader: string, purpose: string, personal = false) {
  const id = randomUUID();
  await client.query(`INSERT INTO stored_files
    (id,"organizationId","ownerUserId","uploadedByUserId",purpose,bucket,"objectKey","originalName","declaredMimeType","expectedBytes","expiresAt","updatedAt")
    VALUES ($1,$2,$3,$4,$5,'core-shop-private',$6,'image.png','image/png',100,now()+interval '1 hour',now())`,
  [id, personal ? null : owner, personal ? owner : null, uploader, purpose,
    `${personal ? 'users' : 'organizations'}/${owner}/${id}/original`]);
  return id;
}

async function readyFile(client: PoolClient, id: string) {
  await client.query('UPDATE stored_files SET status=\'UPLOADED\' WHERE id=$1', [id]);
  await client.query('UPDATE stored_files SET status=\'QUARANTINED\' WHERE id=$1', [id]);
  await client.query(`UPDATE stored_files SET status='READY', "scanStatus"='CLEAN', "uploadedBytes"=100,"actualBytes"=100,
    "verifiedMimeType"='image/png',sha256=$2::text,"sourceEtag"='source-etag',"finalEtag"='final-etag',
    "finalObjectKey"=CASE WHEN "ownerUserId" IS NOT NULL THEN 'users/'||"ownerUserId"::text ELSE 'organizations/'||"organizationId"::text END||'/'||id::text||'/verified/'||$2::text,
    width=10,height=10,"verifiedAt"=now() WHERE id=$1`,
  [id, 'a'.repeat(64)]);
}

test('cross-tenant roles and branch grants fail at the database boundary', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  const b = await fixture(client);
  const role = randomUUID();
  const branch = randomUUID();
  await client.query('INSERT INTO roles (id,"organizationId",code,name,"updatedAt") VALUES ($1,$2,\'MANAGER\',\'Manager\',now())', [role, b.organization]);
  await client.query('INSERT INTO branches (id,"organizationId",code,name,"updatedAt") VALUES ($1,$2,\'MAIN\',\'Main\',now())', [branch, b.organization]);
  await rejectsSql(client, 'INSERT INTO membership_roles ("organizationId","membershipId","roleId") VALUES ($1,$2,$3)',
    [a.organization, a.membership, role], '23503');
  await rejectsSql(client, 'INSERT INTO branch_grants ("organizationId","membershipId","branchId") VALUES ($1,$2,$3)',
    [a.organization, a.membership, branch], '23503');
  await rejectsSql(client, 'INSERT INTO audit_events (id,"organizationId","actorId","requestId",action,"entityType",metadata) VALUES ($1,$2,$3,$4,\'TEST\',\'TEST\',\'{}\')',
    [randomUUID(), b.organization, a.user, randomUUID()], '23503');
  await client.query('SET CONSTRAINTS ALL IMMEDIATE');
}));

test('organizations require an owner and ownership can transfer atomically', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  // One parameterized statement at a time; deferred checks are explicitly forced.
  await client.query('SAVEPOINT owner_change');
  await client.query('UPDATE memberships SET "isOwner"=false WHERE id=$1', [a.membership]);
  await assert.rejects(client.query('SET CONSTRAINTS ALL IMMEDIATE'), (e: unknown) => e instanceof Error && 'code' in e && e.code === '23514');
  await client.query('ROLLBACK TO SAVEPOINT owner_change');
  const replacement = randomUUID();
  await client.query('INSERT INTO users (id,email,"displayName","updatedAt") VALUES ($1,$2,\'Replacement\',now())', [replacement, `${replacement}@example.test`]);
  await client.query('INSERT INTO memberships (id,"organizationId","userId","isOwner","branchAccess","updatedAt") VALUES ($1,$2,$3,true,\'ALL\',now())',
    [randomUUID(), a.organization, replacement]);
  await client.query('UPDATE memberships SET "isOwner"=false WHERE id=$1', [a.membership]);
  await client.query('SET CONSTRAINTS ALL IMMEDIATE');
}));

test('branding requires verified files of the correct purpose and organization', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  const b = await fixture(client);
  const logo = await file(client, a.organization, a.user, 'ORGANIZATION_LOGO');
  await rejectsSql(client, 'INSERT INTO organization_branding ("organizationId","logoFileId","updatedAt") VALUES ($1,$2,now())', [a.organization, logo]);
  await rejectsSql(client, 'UPDATE stored_files SET status=\'READY\' WHERE id=$1', [logo]);
  await readyFile(client, logo);
  await rejectsSql(client, 'INSERT INTO organization_branding ("organizationId","logoFileId","updatedAt") VALUES ($1,$2,now())', [b.organization, logo]);
  await rejectsSql(client, 'INSERT INTO organization_branding ("organizationId","coverFileId","updatedAt") VALUES ($1,$2,now())', [a.organization, logo]);
  await client.query('INSERT INTO organization_branding ("organizationId","logoFileId","updatedAt") VALUES ($1,$2,now())', [a.organization, logo]);
  await rejectsSql(client, 'UPDATE stored_files SET status=\'DELETION_PENDING\' WHERE id=$1', [logo]);
  await rejectsSql(client, 'UPDATE stored_files SET "organizationId"=$1 WHERE id=$2', [b.organization, logo]);
  await client.query('UPDATE organization_branding SET "logoFileId"=NULL WHERE "organizationId"=$1', [a.organization]);
  await client.query('UPDATE stored_files SET status=\'DELETION_PENDING\' WHERE id=$1', [logo]);
}));

test('personal avatars cannot be attached to another account', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  const b = await fixture(client);
  const avatar = await file(client, a.user, a.user, 'USER_AVATAR', true);
  await readyFile(client, avatar);
  await rejectsSql(client, 'INSERT INTO user_avatars ("userId","fileId","updatedAt") VALUES ($1,$2,now())', [b.user, avatar]);
  await client.query('INSERT INTO user_avatars ("userId","fileId","updatedAt") VALUES ($1,$2,now())', [a.user, avatar]);
}));

test('file limits and verification evidence remain enforced below application code', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  const avatar = await file(client, a.user, a.user, 'USER_AVATAR', true);
  await rejectsSql(client, 'UPDATE stored_files SET "ownerUserId"=NULL WHERE id=$1', [avatar]);
  await client.query('UPDATE stored_files SET status=\'UPLOADED\' WHERE id=$1', [avatar]);
  await client.query('UPDATE stored_files SET status=\'QUARANTINED\' WHERE id=$1', [avatar]);
  await rejectsSql(client, 'UPDATE stored_files SET "scanStatus"=\'CLEAN\',status=\'READY\' WHERE id=$1', [avatar]);
  await rejectsSql(client, 'UPDATE stored_files SET width=10,height=NULL WHERE id=$1', [avatar]);
  await rejectsSql(client, 'UPDATE organizations SET timezone=\'Invalid/Zone\' WHERE id=$1', [a.organization]);
  await rejectsSql(client, 'UPDATE organizations SET "currencyScale"=9 WHERE id=$1', [a.organization]);
}));

test('runtime cannot create tables, elevate platform roles, or change migration history', async () => rollbackTest(async (client) => {
  await rejectsSql(client, 'CREATE TABLE public.forbidden_runtime_table (id integer)', [], '42501');
  await rejectsSql(client, 'DELETE FROM _prisma_migrations', [], '42501');
  await rejectsSql(client, 'DELETE FROM platform_grants', [], '42501');
  await rejectsSql(client, 'DELETE FROM permissions', [], '42501');
}));

test('readiness checks runtime privileges, schema history, and disconnected databases', async () => {
  const config = validateEnvironment({ NODE_ENV: 'test', DATABASE_URL: url, DATABASE_CONNECT_TIMEOUT_MS: 100, DATABASE_QUERY_TIMEOUT_MS: 1000 });
  const database = new DatabaseService(new ConfigService(config));
  try {
    assert.equal(await database.isReady(), true);
    const { rows } = await pool.query('SELECT count(*)::integer AS count FROM permissions');
    assert.equal(rows[0].count, 38);
  } finally { await database.onModuleDestroy(); }
  const offline = new DatabaseService(new ConfigService({ ...config, DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/core_shop_test_offline' }));
  try { assert.equal(await offline.isReady(), false); } finally { await offline.onModuleDestroy(); }
});

test('concurrent owner removals cannot leave an organization ownerless', async () => {
  const setup = await pool.connect();
  let a: Awaited<ReturnType<typeof fixture>>;
  const secondUser = randomUUID();
  const secondMembership = randomUUID();
  try {
    await setup.query('BEGIN');
    a = await fixture(setup);
    await setup.query('INSERT INTO users (id,email,"displayName","updatedAt") VALUES ($1,$2,\'Second owner\',now())', [secondUser, `${secondUser}@example.test`]);
    await setup.query('INSERT INTO memberships (id,"organizationId","userId","isOwner","branchAccess","updatedAt") VALUES ($1,$2,$3,true,\'ALL\',now())', [secondMembership, a.organization, secondUser]);
    await setup.query('COMMIT');
  } catch (error) {
    await setup.query('ROLLBACK');
    throw error;
  } finally { setup.release(); }
  const removeOwner = async (id: string) => {
    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      await connection.query('UPDATE memberships SET "isOwner"=false WHERE id=$1', [id]);
      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally { connection.release(); }
  };
  const results = await Promise.allSettled([removeOwner(a.membership), removeOwner(secondMembership)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const { rows } = await pool.query('SELECT count(*)::integer AS count FROM memberships WHERE "organizationId"=$1 AND "isOwner" AND status=\'ACTIVE\'', [a.organization]);
  assert.equal(rows[0].count, 1);
  // Data is confined to the disposable integration database.
});

test('HTTP readiness reports a migrated database and rejects incompatible schema', async () => {
  const migrationUrl = process.env.TEST_MIGRATION_DATABASE_URL;
  if (!migrationUrl) throw new Error('TEST_MIGRATION_DATABASE_URL is required for disposable schema tests.');
  const migrationTarget = new URL(migrationUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(migrationTarget.hostname));
  assert.equal(migrationTarget.pathname, target.pathname);
  const owner = new Pool({ connectionString: migrationUrl, connectionTimeoutMillis: 2000 });
  const config = validateEnvironment({ NODE_ENV: 'test', DATABASE_URL: url });
  const database = new DatabaseService(new ConfigService(config));
  try {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const { createApp } = require('./dist/app');
      (async () => {
        const app = await createApp();
        try {
          await app.init();
          const response = await app.inject({ method: 'GET', url: '/ready' });
          assert.equal(response.statusCode, 200);
          assert.deepEqual(response.json(), { status: 'ready', service: 'core-shop-server' });
          assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
        } finally { await app.close(); }
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `], { env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: url, MIGRATION_DATABASE_URL: '', CORS_ORIGINS: '' }, encoding: 'utf8', timeout: 15000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, 'HTTP readiness smoke test failed. Build the server before integration tests.');
    await owner.query('UPDATE _prisma_migrations SET finished_at=NULL');
    assert.equal(await database.isReady(), false);
    await owner.query('UPDATE _prisma_migrations SET finished_at=now()');
    assert.equal(await database.isReady(), true);
    await owner.query('ALTER TABLE stored_files RENAME TO stored_files_missing_test');
    assert.equal(await database.isReady(), false);
    await owner.query('ALTER TABLE stored_files_missing_test RENAME TO stored_files');
    const privileged = new DatabaseService(new ConfigService({ ...config, DATABASE_URL: migrationUrl }));
    try { assert.equal(await privileged.isReady(), false); } finally { await privileged.onModuleDestroy(); }
  } finally {
    await owner.query('UPDATE _prisma_migrations SET finished_at=COALESCE(finished_at,now())');
    const { rows } = await owner.query("SELECT to_regclass('public.stored_files_missing_test') AS missing");
    if (rows[0].missing) await owner.query('ALTER TABLE stored_files_missing_test RENAME TO stored_files');
    await owner.end();
    await database.onModuleDestroy();
  }
});

async function activeFixture() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const a = await fixture(client);
    await client.query('UPDATE users SET status=\'ACTIVE\' WHERE id=$1', [a.user]);
    await client.query('UPDATE organizations SET status=\'ACTIVE\' WHERE id=$1', [a.organization]);
    await client.query('COMMIT');
    return a;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

function services() {
  const database = new DatabaseService(new ConfigService(validateEnvironment({ NODE_ENV: 'test', DATABASE_URL: url })));
  const authorization = new TenantAuthorization(database);
  return { database, authorization, commands: new CommandService(database, authorization, new AuditService()) };
}

test('durable commands serialize duplicates, reject payload changes, and atomically persist audit/outbox', async () => {
  const a = await activeFixture();
  const { database, authorization, commands } = services();
  try {
    const scope = await authorization.resolve(a.user, a.organization, undefined, ['CUSTOMER_PAYMENT_CREATE']);
    const input = { operation: `CUSTOMER_PAYMENT:${randomUUID()}`, key: randomUUID(), requestId: randomUUID(), payload: { amount: '100.00', currency: 'BDT' } };
    let calls = 0;
    const handler: Parameters<CommandService['execute']>[2] = async (tx, current, commandId) => {
      calls++;
      const branch = await tx.branch.create({ data: { organizationId: current.organizationId, code: 'CMD_' + randomUUID().slice(0, 8).toUpperCase(), name: 'Command effect' } });
      await commands.enqueue(tx, current, commandId, 'RECEIPT_REQUESTED', { entityId: branch.id, documentLocale: 'bn' });
      return { statusCode: 201, body: { id: branch.id, balance: '100.00' } };
    };
    const results = await Promise.all([commands.execute(scope, input, handler), commands.execute(scope, input, handler)]);
    assert.deepEqual(results[0].body, results[1].body);
    assert.equal(results.filter((r) => r.replayed).length, 1);
    assert.equal(calls, 1);
    await assert.rejects(commands.execute(scope, { ...input, payload: { amount: '101.00', currency: 'BDT' } }, handler),
      (e: unknown) => e instanceof DomainError && e.code === 'IDEMPOTENCY_PAYLOAD_MISMATCH');
    assert.equal(await database.client!.commandRecord.count({ where: { organizationId: a.organization } }), 1);
    assert.equal(await database.client!.auditEvent.count({ where: { organizationId: a.organization } }), 1);
    assert.equal(await database.client!.outboxEvent.count({ where: { organizationId: a.organization } }), 1);
    await assert.rejects(commands.execute({ ...scope }, { ...input, key: randomUUID() }, handler),
      (e: unknown) => e instanceof DomainError && e.code === 'FORBIDDEN');
    await pool.query('UPDATE users SET status=\'SUSPENDED\' WHERE id=$1', [a.user]);
    await assert.rejects(commands.execute(scope, input, handler), (e: unknown) => e instanceof DomainError && e.code === 'FORBIDDEN');
    await rejectsSqlForPool('UPDATE command_records SET result=\'{}\'::jsonb WHERE "organizationId"=$1', [a.organization], '23514');
    await rejectsSqlForPool('UPDATE audit_events SET action=\'TAMPERED\' WHERE "organizationId"=$1', [a.organization], '42501');
    await rejectsSqlForPool('UPDATE outbox_events SET status=\'DELIVERED\' WHERE "organizationId"=$1', [a.organization], '42501');
  } finally { await database.onModuleDestroy(); }
});

async function rejectsSqlForPool(sql: string, params: unknown[], code: string) {
  await assert.rejects(pool.query(sql, params), (e: unknown) => e instanceof Error && 'code' in e && e.code === code);
}

test('failed commands roll back business effects, command claims, audit and outbox together', async () => {
  const a = await activeFixture();
  const { database, authorization, commands } = services();
  try {
    const scope = await authorization.resolve(a.user, a.organization, undefined, ['ORG_UPDATE']);
    const input = { operation: 'TEST_ROLLBACK', key: randomUUID(), requestId: randomUUID(), payload: { amount: '100.00' } };
    await assert.rejects(commands.execute(scope, input, async (tx, current, commandId) => {
      const branch = await tx.branch.create({ data: { organizationId: current.organizationId, code: 'ROLLBACK', name: 'Rolled back' } });
      await commands.enqueue(tx, current, commandId, 'RECEIPT_REQUESTED', { entityId: branch.id });
      throw new DomainError('PAYMENT_EXCEEDS_OUTSTANDING', 422);
    }), (e: unknown) => e instanceof DomainError && e.code === 'PAYMENT_EXCEEDS_OUTSTANDING');
    for (const table of ['branches', 'command_records', 'audit_events', 'outbox_events']) {
      // Table identifiers are fixed test constants, never request input.
      const { rows } = await pool.query(`SELECT count(*)::integer AS count FROM ${table} WHERE "organizationId"=$1`, [a.organization]);
      assert.equal(rows[0].count, 0, table);
    }
  } finally { await database.onModuleDestroy(); }
});

test('authorization scopes current memberships, roles and branch grants without owner tenant bypass', async () => {
  const a = await activeFixture(); const b = await activeFixture();
  const staff = randomUUID(); const member = randomUUID(); const role = randomUUID(); const branch = randomUUID();
  await pool.query('INSERT INTO users (id,email,"displayName",status,"updatedAt") VALUES ($1,$2,\'Staff\',\'ACTIVE\',now())', [staff, `${staff}@example.test`]);
  await pool.query('INSERT INTO memberships (id,"organizationId","userId","updatedAt") VALUES ($1,$2,$3,now())', [member, a.organization, staff]);
  await pool.query('INSERT INTO roles (id,"organizationId",code,name,"updatedAt") VALUES ($1,$2,\'CLERK\',\'Clerk\',now())', [role, a.organization]);
  await pool.query('INSERT INTO role_permissions ("roleId","permissionCode") VALUES ($1,\'CUSTOMER_PAYMENT_CREATE\')', [role]);
  await pool.query('INSERT INTO membership_roles ("organizationId","membershipId","roleId") VALUES ($1,$2,$3)', [a.organization, member, role]);
  await pool.query('INSERT INTO branches (id,"organizationId",code,name,"updatedAt") VALUES ($1,$2,\'MAIN\',\'Main\',now())', [branch, a.organization]);
  const { database, authorization, commands } = services();
  try {
    await assert.rejects(authorization.resolve(staff, a.organization, branch, ['CUSTOMER_PAYMENT_CREATE']));
    await pool.query('INSERT INTO branch_grants ("organizationId","membershipId","branchId") VALUES ($1,$2,$3)', [a.organization, member, branch]);
    const scope = await authorization.resolve(staff, a.organization, branch, ['CUSTOMER_PAYMENT_CREATE']);
    assert.deepEqual(scope.branchIds, [branch]);
    const http = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const {Controller,Get,Module} = require('@nestjs/common');
      const {AppModule} = require('./dist/app.module');
      const {createApp} = require('./dist/app');
      const {IdentityVerifier,RequirePermissions,RequireBranch} = require('./dist/common/guards/access');
      class ProtectedController { get() { return {ok:true}; } }
      Controller('__tenant_test')(ProtectedController);
      const descriptor=Object.getOwnPropertyDescriptor(ProtectedController.prototype,'get');
      Get()(ProtectedController.prototype,'get',descriptor);
      RequirePermissions('CUSTOMER_PAYMENT_CREATE')(ProtectedController.prototype,'get',descriptor);
      RequireBranch()(ProtectedController.prototype,'get',descriptor);
      class TestModule {}
      Module({imports:[AppModule],controllers:[ProtectedController]})(TestModule);
      (async()=>{
        const app=await createApp(TestModule);
        try {
          app.get(IdentityVerifier).verify=async()=>({userId:process.env.TEST_ACTOR_ID,credentialId:'test-verified-session'});
          await app.init();
          const headers={'x-organization-id':process.env.TEST_ORGANIZATION_ID,'x-branch-id':process.env.TEST_BRANCH_ID};
          assert.equal((await app.inject({method:'GET',url:'/api/v1/__tenant_test',headers})).statusCode,200);
          assert.equal((await app.inject({method:'GET',url:'/api/v1/__tenant_test',headers:{...headers,'x-organization-id':process.env.TEST_FOREIGN_ID}})).statusCode,403);
          assert.equal((await app.inject({method:'GET',url:'/api/v1/__tenant_test'})).statusCode,400);
        } finally { await app.close(); }
      })().catch(()=>{process.exitCode=1;});
    `], { encoding: 'utf8', timeout: 15000, env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: url,
      MIGRATION_DATABASE_URL: '', LOG_LEVEL: 'silent', CORS_ORIGINS: '',
      TEST_ACTOR_ID: staff, TEST_ORGANIZATION_ID: a.organization, TEST_BRANCH_ID: branch, TEST_FOREIGN_ID: b.organization } });
    assert.equal(http.status, 0, 'Tenant guard HTTP contract failed.');
    await assert.rejects(authorization.resolve(a.user, b.organization, undefined, ['ORG_VIEW']));
    await assert.rejects(authorization.resolve(staff, a.organization, branch, ['REPORT_PROFIT']));
    await pool.query('DELETE FROM role_permissions WHERE "roleId"=$1', [role]);
    await assert.rejects(commands.execute(scope, { operation: 'TEST_ACCESS', key: randomUUID(), requestId: randomUUID(), payload: {} },
      async () => ({ statusCode: 200, body: {} })), (e: unknown) => e instanceof DomainError && e.code === 'FORBIDDEN');
  } finally { await database.onModuleDestroy(); }
});

test('R2 finalized identity is immutable without S3 version IDs and incomplete command claims cannot commit', async () => rollbackTest(async (client) => {
  const a = await fixture(client);
  const image = await file(client, a.user, a.user, 'USER_AVATAR', true);
  await readyFile(client, image);
  const { rows } = await client.query('SELECT "sourceVersion","storageVersion","finalObjectKey" FROM stored_files WHERE id=$1', [image]);
  assert.equal(rows[0].sourceVersion, null); assert.equal(rows[0].storageVersion, null);
  assert.ok(rows[0].finalObjectKey.endsWith('/verified/' + 'a'.repeat(64)));
  await rejectsSql(client, 'UPDATE stored_files SET "finalEtag"=\'tampered\' WHERE id=$1', [image]);
  await client.query('SAVEPOINT pending_command');
  await client.query('INSERT INTO command_records (id,"organizationId","actorId",operation,key,"payloadHash","requestId") VALUES ($1,$2,$3,\'PENDING_TEST\',$4,$5,$6)',
    [randomUUID(), a.organization, a.user, randomUUID(), 'a'.repeat(64), randomUUID()]);
  await assert.rejects(client.query('SET CONSTRAINTS ALL IMMEDIATE'), (e: unknown) => e instanceof Error && 'code' in e && e.code === '23514');
  await client.query('ROLLBACK TO SAVEPOINT pending_command');
}));
