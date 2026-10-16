import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { Pool, PoolClient } from 'pg';
import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from '../../src/config/environment';
import { DatabaseService } from '../../src/database/database.service';

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
  await client.query(`UPDATE stored_files SET status='READY', "scanStatus"='CLEAN', "uploadedBytes"=100,"sourceVersion"='source-version',"actualBytes"=100,
    "verifiedMimeType"='image/png',sha256=$2,"storageVersion"='test-version',width=10,height=10,"verifiedAt"=now() WHERE id=$1`,
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
    assert.equal(rows[0].count, 21);
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
