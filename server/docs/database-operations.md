# Local database workflow

Use Node.js 24, Yarn Classic 1.22.22, and a supported local PostgreSQL installation. This foundation was verified against PostgreSQL 18.

## Separate application and migration access

Provision a database owner and a restricted runtime login. If these already exist, preserve them and their credentials. For a new local installation, an administrator can use:

```sql
CREATE ROLE core_shop LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
\password core_shop
CREATE DATABASE core_shop OWNER core_shop;
CREATE ROLE core_shop_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
\password core_shop_runtime
```

The `\password` commands prompt without placing passwords in a SQL file. Use different secrets for the two logins. The database owner is used for schema migrations only; never grant its role to the runtime login.

Set these values in ignored `.env.local`, substituting the real, percent-encoded passwords:

```dotenv
DATABASE_URL=postgresql://core_shop_runtime:ENCODED_RUNTIME_PASSWORD@127.0.0.1:5432/core_shop
MIGRATION_DATABASE_URL=postgresql://core_shop:ENCODED_MIGRATION_PASSWORD@127.0.0.1:5432/core_shop
DATABASE_POOL_MAX=10
DATABASE_CONNECT_TIMEOUT_MS=3000
DATABASE_QUERY_TIMEOUT_MS=5000
```

`src/config/` controls both runtime and CLI environment selection. Explicit process variables override file values. CLI commands prefer `MIGRATION_DATABASE_URL`; absent it, they use `DATABASE_URL`, which must have the privileges required by that command. Generation and validation work without a configured connection. Application startup requires a non-empty `DATABASE_URL` outside test mode.

## Apply the reviewed migration

From `server/`:

```bash
yarn db:validate
yarn db:generate
yarn db:migrate
```

Then grant current application-table access as the schema owner:

```bash
psql -h 127.0.0.1 -U core_shop -d core_shop -W -v ON_ERROR_STOP=1 -f scripts/database/grant-runtime.sql
yarn db:seed
```

The seed upserts 38 permission definitions, including the current customer/supplier ledger and payment capabilities. It is safe to repeat; it creates no users, memberships, platform administrators, passwords, or production example data.

`db:migrate` runs `prisma migrate deploy` and applies committed migrations without resetting data. `db:migrate:dev` is for generating reviewed development migrations and may require a separately provisioned shadow database. Never point development migration commands at production. SQL constraints and triggers are part of the initial migration and must be preserved in future diffs.

After adding a migration, update `src/database/schema-version.ts`, review runtime grants, and extend integration tests. An application with an unexpected migration history reports not ready. Readiness is not a replacement for reviewing migration checksums and database drift during deployment.

## Check connectivity and readiness

```bash
yarn start:dev
curl http://localhost:3000/health
curl -i http://localhost:3000/ready
```

Expected readiness response after both committed migrations on a migrated database with the restricted login:

```json
{"status":"ready","service":"core-shop-server"}
```

Database downtime, incompatible migration history, missing representative schema, or privileged runtime credentials produce a generic 503 in the shared error envelope, with code `SERVICE_UNAVAILABLE` and request ID. `/health` continues to report process liveness.

The runtime login has no DDL, role-management, or platform-elevation write privileges. It can still read tenant tables because authenticated RLS context has not been implemented; no business-data routes are exposed. See [database design](database-design.md) for the isolation boundary and next-phase obligations.

## Automated verification

```bash
yarn run check
yarn test:integration
```

`check` validates/generates Prisma, lints, typechecks, runs isolated tests, and builds. Isolated tests never read local or production environment files.

`test:integration` builds and then creates an empty `core_shop_test_*` database and a random restricted test login. It applies the migration, applies current runtime grants, runs the reference seed twice, and executes real PostgreSQL tests. The runner removes only the database and login it generated, even after a test failure. It does not read `.env.local` or reuse application data.

The local runner requires the current OS account to have PostgreSQL administrator access through peer authentication on `/var/run/postgresql`, plus PostgreSQL TCP access on `127.0.0.1:5432`. It is a local development tool, not a production or remote-database command. For CI or another installation, provision a disposable local database with equivalent migration/runtime roles and run the integration test file with `TEST_DATABASE_URL` and `TEST_MIGRATION_DATABASE_URL`; tests reject non-local hosts and database names outside `core_shop_test_*`.

## Deployment boundary

No production database is provisioned by this phase. Before deployment, use secret injection, verified TLS, private networking, a controlled migration job, separate logins, encrypted backups, and restore verification. Local credentials must never become production credentials. Runtime pool limits apply per process, so size the total against PostgreSQL connection capacity.
