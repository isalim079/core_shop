// Disposable PostgreSQL integration runner. Never reads .env.local or application data.
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { userInfo } = require('node:os');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { Pool } = require('pg');

process.chdir(resolve(__dirname, '../..'));
const suffix = randomBytes(6).toString('hex');
const databaseName = `core_shop_test_${suffix}`;
const runtimeRole = `core_shop_test_runtime_${suffix}`;
const password = randomBytes(32).toString('base64url');
const adminUrl = new URL(`postgresql://localhost/postgres`);
adminUrl.username = userInfo().username;
adminUrl.searchParams.set('host', '/var/run/postgresql');
const migrationUrl = new URL(adminUrl);
migrationUrl.pathname = `/${databaseName}`;
const runtimeUrl = new URL(`postgresql://127.0.0.1:5432/${databaseName}`);
runtimeUrl.username = runtimeRole;
runtimeUrl.password = password;
const testEnv = {
  ...process.env, LOG_LEVEL: 'silent', AUTH_SECRET: randomBytes(32).toString('base64url'), GOOGLE_CLIENT_IDS: 'core-shop-test.apps.googleusercontent.com', CORS_ORIGINS: 'http://localhost:5173', RATE_LIMIT_MAX: '10000', NODE_ENV: 'test', DATABASE_URL: runtimeUrl.href,
  MIGRATION_DATABASE_URL: migrationUrl.href, TEST_DATABASE_URL: runtimeUrl.href,
  TEST_MIGRATION_DATABASE_URL: migrationUrl.href,
};

function run(args) {
  const result = spawnSync(args[0], args.slice(1), { env: testEnv, encoding: 'utf8', timeout: 90_000 });
  if (result.status !== 0 || result.error) {
    // Output is restricted to commands with no credential arguments; redact URLs defensively.
    const output = `${result.stdout || ''}\n${result.stderr || ''}`
      .split(runtimeUrl.href).join('[redacted]').split(migrationUrl.href).join('[redacted]');
    process.stderr.write(output);
    throw new Error('Integration command failed.');
  }
  process.stdout.write(result.stdout);
}

async function main() {
  const admin = new Pool({ connectionString: adminUrl.href, connectionTimeoutMillis: 2000, max: 1 });
  let databaseCreated = false;
  let roleCreated = false;
  try {
    await admin.query(`CREATE ROLE "${runtimeRole}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD '${password}'`);
    roleCreated = true;
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    databaseCreated = true;
    run(['yarn', 'db:migrate']);
    const owner = new Pool({ connectionString: migrationUrl.href, max: 1 });
    try {
      const grants = readFileSync('scripts/database/grant-runtime.sql', 'utf8').replaceAll('core_shop_runtime', runtimeRole);
      await owner.query(grants);
    } finally { await owner.end(); }
    run(['yarn', 'db:seed']);
    run(['yarn', 'db:seed']);
    run(['node_modules/.bin/tsx', '--test', '--test-concurrency=1', 'test/integration/database.test.ts', 'test/integration/auth.test.ts', 'test/integration/organizations.test.ts']);
  } finally {
    // Names are generated internally; cleanup is confined to resources created above.
    try {
      if (databaseCreated) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      if (roleCreated) await admin.query(`DROP ROLE "${runtimeRole}"`);
    } finally { await admin.end(); }
  }
}

main().catch(() => {
  console.error('Local integration verification failed. It requires a local PostgreSQL administrator accessible through peer authentication on /var/run/postgresql.');
  process.exitCode = 1;
});
