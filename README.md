# Core Shop

A business management platform for small and medium retail businesses, bringing sales, purchasing, inventory, customers, suppliers, expenses, and reporting into one system for web and mobile.

Core Shop is being developed as a multi-tenant SaaS platform. One shared backend will serve the web and mobile applications, with organizations and branches forming the foundation for business data isolation and staff access.

## Project status

**In active development. Server Phase 2 is implemented and verified; owner review is pending.**

| Component | Current state |
| --- | --- |
| Server | NestJS/Fastify API with validated configuration, PostgreSQL/Prisma foundation, health/readiness checks, and development Swagger |
| Mobile | React Native / Expo application workspace; see its source and setup guide for current functionality |
| Web | Reserved directory; implementation has not started |
| Database | PostgreSQL/Prisma identity, tenant, permission, branch, and private-file metadata foundation |
| Background services | Redis and BullMQ integration is planned |

The server has no registration, authentication, tenant-authorized business endpoints, or file upload/download APIs yet. Product capabilities below describe the intended platform rather than completed functionality. Profile images and shop branding have ownership and verification metadata in the database; storage and upload workflows remain future work.

## Product vision

Core Shop aims to give retailers one place to manage daily operations across their shops and branches. A shared commerce core will support different retail categories through configurable products, variants, units, and business settings.

| Area | Planned capabilities |
| --- | --- |
| Organizations and access | Business accounts, branches, memberships, roles, and permissions |
| Product catalog | Products, variants, categories, brands, units, SKUs, and barcodes |
| Inventory | Stock ledger, balances, adjustments, transfers, and low-stock visibility |
| Purchasing | Suppliers, purchase receipts, payments, returns, and payables |
| Sales | Invoices, discounts, payments, returns, and customer receivables |
| Finance | Immutable customer receivable/supplier payable ledgers, collections, allocations, reversals, aging, statements, expenses and reproducible profit reports |
| Localization | Required English/Bangla Web and App UI, per-user language, Unicode search and bilingual receipts/statements |
| Platform services | Subscription plans, entitlements, notifications, exports, and audit records |
| Mobile operations | Offline credit sales, practical payment collection, ledger/cache synchronization and visible conflict recovery |

## Repository structure

```text
core_shop/
├── README.md       # Project overview
├── readme/
│   └── project_structure.md  # Canonical Server / Web / App / Workflow specification
├── server/         # Shared backend API
├── mobile_app/     # React Native / Expo application
└── web/            # Reserved web application directory
```

Each application manages its own dependencies and commands. Run setup and development commands from the relevant application directory.

## Technology

| Layer | Technology | Status |
| --- | --- | --- |
| Backend | Node.js 24, NestJS 12, Fastify, TypeScript | In use |
| Configuration | NestJS ConfigModule and Zod | In use |
| API documentation | Swagger / OpenAPI | Development only |
| Mobile | React Native, Expo, TypeScript | Workspace exists |
| Web | React and TypeScript | Planned |
| Database | PostgreSQL and Prisma 7.10.1 | Foundation implemented |
| Background work | Redis and BullMQ | Planned application integration |
| File storage | S3-compatible object storage | Planned |

## Getting started

### Backend

Prerequisites: Node.js 24 and Yarn Classic 1.22.22.

From the repository root:

```bash
cd server
nvm use
yarn install --frozen-lockfile
cp -n .env.example .env.local
yarn start:dev
```

The copy command preserves an existing `.env.local`. Before starting, follow the [database setup guide](server/docs/database-operations.md) to provision PostgreSQL, set separate runtime/migration URLs, apply migrations, and seed reference permissions. PostgreSQL is required for readiness; Redis is not used yet.

Verify the API:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","service":"core-shop-server"}
```

| Development resource | URL |
| --- | --- |
| Swagger UI | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) |
| OpenAPI JSON | [http://localhost:3000/api-docs-json](http://localhost:3000/api-docs-json) |
| Process health | [http://localhost:3000/health](http://localhost:3000/health) |
| Database readiness | [http://localhost:3000/ready](http://localhost:3000/ready) |

Swagger is disabled in production and test modes. `/health` checks process liveness. `/ready` checks database connectivity, restricted runtime privileges, and schema compatibility. Future business endpoints will use `/api/v1`.

For configuration, commands, folder structure, and production-mode startup, see the [server README](server/README.md).

### Mobile

See the [mobile application README](mobile_app/README.md) for the Expo setup guide. The mobile package includes development-client and native build commands; consult its package scripts for the available workflows.

### Web

The `web/` directory is reserved for the future web application. No web setup is required yet.

## Architecture direction

The backend starts as a modular monolith with domain modules owning their business rules and data access. Web and mobile clients will use the same API.

The design baseline for upcoming implementation includes:

- Organization-scoped data access and branch-aware operations.
- Server-enforced permissions based on authenticated memberships.
- Immutable inventory movements with transactionally maintained stock balances.
- Exact decimal values and historical costs for reliable financial reporting.
- Atomic transactions and idempotency for retry-prone business commands.
- Explicit synchronization rules for supported offline mobile workflows.

These are requirements for future modules, not guarantees provided by the current foundation.

## Development and verification

Run the backend quality checks from `server/` (database generation/validation is now included; consult current environment setup):

```bash
yarn run check
```

This validates/generates Prisma, then runs lint, TypeScript checking, automated tests, and the build. Run `yarn test:integration` for migration, seed, ownership, file lifecycle, and readiness tests on a disposable local database. Current tests cover environment selection and validation, CORS, health responses, unavailable routes, and Swagger access across runtime modes.

Keep credentials in ignored environment files or deployment secret configuration. Commit safe examples only. Production deployment, authentication, storage integration, monitoring, and backups remain future work.

## Design documentation

- [Tenant and database design](server/docs/database-design.md)
- [Private files and onboarding](server/docs/uploads.md)
- [Database setup and verification](server/docs/database-operations.md)

## Roadmap

Development proceeds in reviewed phases:

1. **Server foundation** — implemented and verified.
2. **Database and tenant design** — implemented and verified; owner review pending. Includes PostgreSQL, Prisma, scoped relationships, private-file metadata, and readiness checks.
3. **API and security foundation** — validation, errors, logging, authorization interfaces, and audit infrastructure.
4. **Identity and business access** — authentication, organizations, memberships, and branches.
5. **Commerce workflows** — catalog, customers, suppliers, inventory, purchasing, sales, and payments.
6. **Business insights and platform features** — expenses, reports, plans, and entitlements.
7. **Extended services** — mobile synchronization, files, exports, workers, and platform administration.
8. **Launch preparation** — deployment, monitoring, backups, recovery, and operational verification.

The source of truth is the [four-section project specification](readme/project_structure.md). Implementation evidence and remaining work live in [server progress](server/readme/serverProgress.md), [mobile plan](mobile_app/readme/mobilePlan.md) and [mobile progress](mobile_app/readme/mobileProgress.md). Documentation directories are eligible for Git tracking; environment files and generated outputs remain ignored.
