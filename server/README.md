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

**Phase 1: server foundation implemented and verified.**

The server currently includes:

- A NestJS application using the Fastify HTTP adapter.
- Centralized environment loading and validation in `src/config/`.
- A public process-liveness endpoint at `GET /health`.
- Development-only Swagger UI and OpenAPI documents.
- The `/api/v1` prefix reserved for business endpoints.
- Configurable browser CORS origins, shutdown hooks, and a 1 MiB request body limit.
- Strict TypeScript, linting, automated tests, and build tooling.

Database integration, Prisma models and migrations, authentication, tenant authorization, and business endpoints are planned. PostgreSQL and Redis connection settings are accepted, but the application does not connect to either service yet. A readiness endpoint is also planned.

## Technology stack

| Component | Technology | Status |
| --- | --- | --- |
| Runtime | Node.js 24 | In use |
| Language | TypeScript with strict checking | In use |
| API framework | NestJS 12 | In use |
| HTTP adapter | Fastify | In use |
| Configuration validation | Zod | In use |
| API documentation | Swagger / OpenAPI | Development only |
| Package manager | Yarn Classic 1.22.22 | In use |
| Testing | Node.js test runner | In use |
| Database and ORM | PostgreSQL and Prisma | Planned integration |
| Cache and background jobs | Redis and BullMQ | Planned integration |

## Getting started

### Prerequisites

- Node.js 24, matching `.nvmrc`.
- Yarn Classic 1.22.22.

PostgreSQL and Redis are optional for the current foundation. They will be required as their integrations are implemented.

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

Review `.env.local`, then start the development server:

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

Swagger routes and their assets are disabled in production and test modes. Business routes will use `/api/v1`; `/health` remains outside that prefix.

## Environment configuration

Configuration is loaded and validated through `src/config/`. Application code reads settings through the global NestJS `ConfigService`.

| Variable | Purpose | Default when omitted |
| --- | --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |
| `HOST` | HTTP listener address | `127.0.0.1` |
| `PORT` | HTTP listener port | `3000` |
| `CORS_ORIGINS` | Comma-separated list of exact browser origins | Empty; browser cross-origin access disabled |
| `DATABASE_URL` | PostgreSQL connection URL for future integration | Empty |
| `REDIS_URL` | Redis connection URL for future integration | Empty |

The example environment file sets `HOST=0.0.0.0` and local browser origins for development. A physical mobile device should connect to the development computer's LAN IP address; `localhost` on the phone refers to the phone itself.

### Environment files

| Mode | File | Behavior |
| --- | --- | --- |
| Development | `.env.local` | Loaded by default |
| Production | `.env.production` | Never falls back to `.env.local` |
| Test | None | Tests do not load environment files |

Explicit process environment variables take precedence over file values. `.env.example` is tracked; local and production environment files are ignored by Git. Keep real credentials out of documentation and committed files.

When provided, database URLs must use `postgres://` or `postgresql://`; Redis URLs must use `redis://` or `rediss://`. Reserved characters in URL usernames and passwords must be percent-encoded. Both settings can remain empty until the relevant integration is implemented.

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
| `yarn run check` | Run lint, typecheck, tests, and build |
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
│   ├── health/             # Process-liveness endpoint
│   ├── common/             # Shared infrastructure placeholders
│   ├── database/           # Future database lifecycle and access
│   └── ...                 # Reserved domain module directories
├── prisma/migrations/      # Reserved for future migrations
├── test/                   # Foundation tests and reserved integration/e2e folders
├── scripts/                # Startup and future maintenance scripts
├── infrastructure/         # Reserved deployment configuration
├── .env.example            # Safe configuration template
├── package.json
└── yarn.lock
```

Reserved directories contain placeholders until their assigned features are implemented. There is no Prisma schema or migration yet.

## Architecture and engineering direction

The server follows a modular monolith architecture: one API serves web and mobile clients, with domain modules owning their business rules and data access.

The design baseline for upcoming phases is:

- **Tenant boundaries:** organizations isolate business data; branches narrow operational scope within an organization.
- **Authorization:** permissions are checked on the server against authenticated memberships.
- **Inventory integrity:** immutable stock movements support transactionally maintained balances.
- **Financial accuracy:** exact decimal values and historical cost records support reproducible totals and profit reports.
- **Transaction safety:** related business changes commit together; retry-prone commands use idempotency.
- **Client consistency:** web and mobile consume shared API contracts while business invariants remain on the server.

These are implementation requirements for future modules. The foundation does not yet enforce tenant or business rules.

## Roadmap

Development proceeds one phase at a time, with owner review between phases:

1. Server foundation — implemented and verified.
2. Tenant and domain design, PostgreSQL, and Prisma foundation.
3. Shared API infrastructure and security foundation.
4. Authentication, organizations, permissions, and branches.
5. Catalog, customers, suppliers, inventory, purchases, and sales.
6. Expenses, reporting, subscriptions, and entitlements.
7. Offline synchronization, files, exports, and background workers.
8. Platform administration, deployment, and launch verification.

The detailed local phase plan is maintained in `readme/serverProgress.md`. That directory is intentionally ignored by Git and is absent from fresh clones. The broader product specification lives in the sibling mobile project at `../mobile_app/readme/project_structure.md`.

## Production entry point

Build before starting the compiled application:

```bash
yarn build
yarn start:prod
```

The startup wrapper selects production mode before loading the application. Supply production configuration through process environment variables or `.env.production`.

This entry point supports local production-mode verification. Deployment infrastructure, authentication, dependency readiness, monitoring, and backup workflows are scheduled for later phases; the current foundation is not ready for production business use.

## License

This package is private and marked `UNLICENSED`. No open-source license is granted.
