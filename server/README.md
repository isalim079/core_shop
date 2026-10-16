# Core Shop Server

Backend setup and development guide. See the [project README](../README.md) for the platform overview and repository structure.

The backend API for **Core Shop**, a business management platform for small and medium retail businesses. Core Shop is designed to bring sales, purchasing, inventory, customers, suppliers, expenses, and operational reporting into one system, accessible from web and mobile applications.

This package provides the shared server foundation. Business capabilities are being developed in reviewed phases.

## Project overview

Core Shop aims to support different retail categories through a shared commerce core and configurable shop capabilities. The planned platform supports organizations with multiple branches, staff permissions, product variants, inventory tracking, and financial reporting.

| Product area | Planned capabilities |
| --- | --- |
| Business management | Organizations, branches, memberships, and staff permissions |
| Catalog | Products, variants, categories, brands, units, SKUs, and barcodes |
| Inventory | Stock movements, balances, adjustments, and branch transfers |
| Trading | Purchases, sales, invoices, payments, and returns |
| Business relationships | Customer and supplier records, receivables, and payables |
| Finance and reporting | Expenses, dashboards, stock valuation, and profit reports |
| Platform services | Plans, entitlements, notifications, exports, and audit records |
| Mobile workflows | Selected offline sales and inventory workflows with synchronization |

These capabilities describe the product roadmap. See the current implementation status below for what is available today.

## Current status

**Phase 3: shared API and security foundation implemented; owner review pending.**

The server currently includes:

- A NestJS application using the Fastify HTTP adapter.
- Centralized environment loading and validation in `src/config/`.
- A public process-liveness endpoint at `GET /health` and database/schema readiness at `GET /ready`.
- PostgreSQL/Prisma lifecycle, a versioned migration, and repeatable permission seeding.
- Identity, tenant, membership, role, branch, and private-file metadata models with database constraints.
- Development-only Swagger UI and OpenAPI documents.
- The `/api/v1` prefix reserved for business endpoints.
- Configurable browser CORS origins, shutdown hooks, and a 1 MiB request body limit.
- Strict DTO validation, bounded pagination, safe English/Bangla errors, request IDs, and structured diagnostics.
- Default-deny authentication/permission interfaces, database-backed tenant scopes, security headers and IP rate limiting.
- Durable idempotent command transactions, append-only audit evidence, and an outbox for future post-commit workers.
- Strict TypeScript, linting, automated tests, and build tooling.

Authentication, registration, tenant-authorized business endpoints, Cloudflare R2 API integration, and upload APIs remain future work. File metadata supports profile photos, shop branding, and future images/attachments; it does not upload or serve file bytes. Cloudflare R2 is selected; verified objects use separate immutable keys rather than S3 version IDs. Redis integration is planned. See [database design](docs/database-design.md) and [private-file design](docs/uploads.md) for implemented boundaries and future business rules. The [API/security guide](docs/api-security.md) describes the current request and transaction contracts; the [credit ledger baseline](docs/credit-ledger-design.md) carries the latest Baki requirements.

## Technology stack

| Component | Technology | Status |
| --- | --- | --- |
| Runtime | Node.js 24 | In use |
| Language | TypeScript with strict checking | In use |
| API framework | NestJS 12 | In use |
| HTTP adapter | Fastify | In use |
| Configuration validation | Zod | In use |
| API documentation | Swagger / OpenAPI | Development only |
| Object storage | Cloudflare R2 | Selected; configuration/model ready, API integration planned |
| Package manager | Yarn Classic 1.22.22 | In use |
| Testing | Node.js test runner | In use |
| Database and ORM | PostgreSQL and Prisma 7.10.1 | Foundation implemented |
| Cache and background jobs | Redis and BullMQ | Planned integration |

## Getting started

### Prerequisites

- Node.js 24, matching `.nvmrc`.
- Yarn Classic 1.22.22.

PostgreSQL is required for application readiness. Follow the [database setup guide](docs/database-operations.md) to provision separate migration/runtime logins, configure `.env.local`, apply migrations, and seed permissions before starting. Redis is not used yet.

### Installation

Run these commands from the `server/` directory:

```bash
nvm use
yarn install --frozen-lockfile
```

On first setup, create the local environment file if it does not already exist:

```bash
cp -n .env.example .env.local
```

Complete the [database setup](docs/database-operations.md) and review `.env.local`, then start the development server:

```bash
yarn start:dev
```

The default port is `3000`.

### Verify the server

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","service":"core-shop-server"}
```

This endpoint checks that the API process responds. It does not check database connectivity, Redis, or schema readiness.

## API documentation

With the server running in development mode:

| Resource | URL |
| --- | --- |
| Swagger UI | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) |
| OpenAPI JSON | [http://localhost:3000/api-docs-json](http://localhost:3000/api-docs-json) |
| OpenAPI YAML | [http://localhost:3000/api-docs-yaml](http://localhost:3000/api-docs-yaml) |
| Process health | [http://localhost:3000/health](http://localhost:3000/health) |
| Database readiness | [http://localhost:3000/ready](http://localhost:3000/ready) |

Swagger routes and their assets are disabled in production and test modes. Business routes will use `/api/v1`; `/health` remains outside that prefix.

## Environment configuration

Configuration is loaded and validated through `src/config/`. Application code reads settings through the global NestJS `ConfigService`.

| Variable | Purpose | Default when omitted |
| --- | --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |
| `HOST` | HTTP listener address | `127.0.0.1` |
| `PORT` | HTTP listener port | `3000` |
| `CORS_ORIGINS` | Comma-separated list of exact browser origins | Empty; browser cross-origin access disabled |
| `DATABASE_URL` | Restricted PostgreSQL runtime connection; required outside tests | Empty |
| `MIGRATION_DATABASE_URL` | Separate schema-owner URL for CLI migrations and seed | Empty |
| `DATABASE_POOL_MAX` | Maximum connections per application process | `10` |
| `DATABASE_CONNECT_TIMEOUT_MS` | Pool connection timeout | `3000` |
| `DATABASE_QUERY_TIMEOUT_MS` | PostgreSQL statement timeout | `5000` |
| `REDIS_URL` | Redis connection URL for future integration | Empty |
| `LOG_LEVEL` | Structured diagnostic log level | `info` |
| `TRUST_PROXY_CIDRS` | Exact trusted ingress IP addresses/CIDRs | Empty; forwarded headers ignored |
| `RATE_LIMIT_MAX` | Requests per IP per process/window | `120` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds | `60000` |
| `STORAGE_PROVIDER` | Selected object store | `cloudflare-r2` |
| `R2_ACCOUNT_ID`, `R2_BUCKET_NAME` | Private R2 account/bucket selection | Empty |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Server-only R2 credentials | Empty |

The example environment file sets `HOST=0.0.0.0` and local browser origins for development. A physical mobile device should connect to the development computer's LAN IP address; `localhost` on the phone refers to the phone itself.

### Environment files

| Mode | File | Behavior |
| --- | --- | --- |
| Development | `.env.local` | Loaded by default |
| Production | `.env.production` | Never falls back to `.env.local` |
| Test | None | Tests do not load environment files |

Explicit process environment variables take precedence over file values. `.env.example` is tracked; local and production environment files are ignored by Git. Keep real credentials out of documentation and committed files.

When provided, database URLs must use `postgres://` or `postgresql://`; Redis URLs must use `redis://` or `rediss://`. Reserved characters in URL usernames and passwords must be percent-encoded. `DATABASE_URL` is required when running the application outside tests. Redis can remain empty until its integration is implemented. CLI generation/validation do not require a database connection.

Leave R2 settings empty until bucket integration is configured; if any R2 setting is supplied, supply all four together. These values do not currently make cloud requests. Never enable public bucket access for private attachments. Rate limits are currently per process; distributed and account-specific limits belong to the authentication/deployment work.

CORS entries must be exact HTTP(S) origins without paths or embedded credentials. Production browser origins must use HTTPS. CORS controls browser access and does not provide authentication or authorization.

## Development commands

| Command | Purpose |
| --- | --- |
| `yarn start:dev` | Start development mode with rebuild/watch |
| `yarn start` | Build and start the application |
| `yarn lint` | Check source and test files with ESLint |
| `yarn typecheck` | Run strict TypeScript checking |
| `yarn test` | Compile and run automated tests |
| `yarn build` | Compile the application into `dist/` |
| `yarn db:generate` | Generate the Prisma client |
| `yarn db:validate` | Validate the Prisma schema |
| `yarn db:migrate` | Apply committed migrations |
| `yarn db:seed` | Upsert reference permissions |
| `yarn db:status` | Inspect migration status |
| `yarn test:integration` | Build and test against a disposable local PostgreSQL database |
| `yarn run check` | Validate/generate Prisma, lint, typecheck, test, and build |
| `yarn start:prod` | Run compiled output in explicit production mode |

Use `yarn run check` to invoke the project script; Yarn Classic also has a built-in `yarn check` command with a different purpose.

To verify changes locally:

```bash
yarn run check
```

Tests cover environment file selection, configuration validation, CORS rules, process health, unavailable routes, and Swagger availability across runtime modes.

## Project structure

```text
server/
├── src/
│   ├── main.ts             # HTTP listener and startup handling
│   ├── app.ts              # Application factory and HTTP setup
│   ├── app.module.ts       # Root module
│   ├── config/             # Environment loading, validation, and Swagger
│   ├── health/             # Process liveness and database readiness
│   ├── files/              # Upload reservation metadata policies
│   ├── common/             # Shared infrastructure placeholders
│   ├── database/           # Prisma lifecycle and readiness checks
│   └── ...                 # Reserved domain module directories
├── prisma/                 # Schema, committed migration, and permission seed
├── docs/                   # Database, operations, and private-file designs
├── test/                   # Foundation tests and reserved integration/e2e folders
├── scripts/                # Startup and future maintenance scripts
├── infrastructure/         # Reserved deployment configuration
├── .env.example            # Safe configuration template
├── package.json
└── yarn.lock
```

Remaining domain directories contain placeholders until their assigned features are implemented. Generated Prisma code is ignored by Git and regenerated on installation or through `yarn db:generate`.

## Architecture and engineering direction

The server follows a modular monolith architecture: one API serves web and mobile clients, with domain modules owning their business rules and data access.

The design baseline for upcoming phases is:

- **Tenant boundaries:** organizations isolate business data; branches narrow operational scope within an organization.
- **Authorization:** permissions are checked on the server against authenticated memberships.
- **Inventory integrity:** immutable stock movements support transactionally maintained balances.
- **Financial accuracy:** exact decimal values and historical cost records support reproducible totals and profit reports.
- **Transaction safety:** related business changes commit together; retry-prone commands use idempotency.
- **Client consistency:** web and mobile consume shared API contracts while business invariants remain on the server.

These are implementation requirements for future modules. The foundation enforces scoped relationships, owner retention, and file metadata invariants in PostgreSQL. Authenticated read authorization and full commerce workflows are not implemented yet.

## Roadmap

Development proceeds one phase at a time, with owner review between phases:

1. Server foundation — implemented and verified.
2. Tenant and domain design, PostgreSQL, and Prisma foundation — accepted.
3. Shared API infrastructure and security foundation — implemented; owner review pending.
4. Authentication, organizations, permissions, and branches.
5. Catalog, customers, suppliers, inventory, purchases, and sales.
6. Expenses, reporting, subscriptions, and entitlements.
7. Offline synchronization, files, exports, and background workers.
8. Platform administration, deployment, and launch verification.

The detailed phase plan is maintained in `readme/serverProgress.md`. The canonical product specification lives at `../readme/project_structure.md`. Include these documents when sharing the full project plan.

## Production entry point

Build before starting the compiled application:

```bash
yarn build
yarn start:prod
```

The startup wrapper selects production mode before loading the application. Supply production configuration through process environment variables or `.env.production`.

This entry point supports local production-mode verification. Deployment infrastructure, authentication, storage integration, monitoring, and backup workflows are scheduled for later phases; the current foundation is not ready for production business use.

## License

This package is private and marked `UNLICENSED`. No open-source license is granted.
