# Core Shop

A business management platform for small and medium retail businesses, bringing sales, purchasing, inventory, customers, suppliers, expenses, and reporting into one system for web and mobile.

Core Shop is being developed as a multi-tenant SaaS platform. One shared backend will serve the web and mobile applications, with organizations and branches forming the foundation for business data isolation and staff access.

## Project status

**In active development. Server Phase 5 organizations, staff access and branches is implemented; owner review is pending.**

| Component | Current state |
| --- | --- |
| Server | NestJS/Fastify API with database foundation, verified contact/password and Google authentication, rotating sessions, bilingual errors, tenant onboarding, staff/branch management, audit and durable commands |
| Mobile | React Native / Expo application workspace; see its source and setup guide for current functionality |
| Web | Reserved directory; implementation has not started |
| Database | PostgreSQL/Prisma identities, authentication sessions/challenges, tenants, permissions, branches and private-file metadata |
| Background services | Redis and BullMQ integration is planned |

The server supports registration/verification, password login/recovery, Google identity verification/linking, and separate web/mobile sessions. SMTP credentials and Google client IDs need configuration; SMS delivery awaits provider selection. See the [authentication guide](server/docs/authentication.md). Organization onboarding, invitations, roles, staff lifecycle and branch APIs are implemented; see the [organizations/access guide](server/docs/organizations-and-access.md). Commerce and file upload/download APIs remain future work. Product capabilities below describe the intended platform rather than completed functionality. Profile images and shop branding have ownership and verification metadata in the database; storage and upload workflows remain future work.

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
| File storage | Cloudflare R2 | Selected; API integration planned |

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

Swagger is disabled in production and test modes. `/health` checks process liveness. `/ready` checks database connectivity, restricted runtime privileges, and schema compatibility. Authentication uses `/api/v1/auth`; organization and staff APIs use `/api/v1/organizations`.

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

This validates/generates Prisma, then runs lint, TypeScript checking, automated tests, and the build. Run `yarn test:integration` for migration, seed, ownership, file lifecycle, readiness and authentication tests on a disposable local database. Current tests also cover verification/recovery, rotation/replay, linking, CSRF, onboarding, staff delegation, ownership, concurrent archival and UTC timestamps.

Keep credentials in ignored environment files or deployment secret configuration. Commit safe examples only. Production deployment, live authentication-provider configuration, storage integration, monitoring, and backups remain future work.

## Design documentation

- [Tenant and database design](server/docs/database-design.md)
- [Private files and onboarding with R2](server/docs/uploads.md)
- [API and security foundation](server/docs/api-security.md)
- [Authentication, providers and client contracts](server/docs/authentication.md)
- [Organizations, staff, branches and ownership](server/docs/organizations-and-access.md)
- [Baki / credit ledger design](server/docs/credit-ledger-design.md)
- [Database setup and verification](server/docs/database-operations.md)

## Roadmap

Development proceeds in reviewed phases:

1. **Server foundation** — implemented and verified.
2. **Database and tenant design** — accepted. Includes PostgreSQL, Prisma, scoped relationships, private-file metadata, and readiness checks.
3. **API and security foundation** — accepted. Includes bilingual errors, safe logging, default-deny authorization interfaces, audit and durable command transactions.
4. **Identity and business access** — authentication accepted; organization, membership, role and branch APIs implemented in server Phase 5, awaiting owner review. Live authentication-provider setup remains pending.
5. **Commerce workflows** — catalog, customers, suppliers, inventory, purchasing, sales, and payments.
6. **Business insights and platform features** — expenses, reports, plans, and entitlements.
7. **Extended services** — mobile synchronization, files, exports, workers, and platform administration.
8. **Launch preparation** — deployment, monitoring, backups, recovery, and operational verification.

The source of truth is the [four-section project specification](readme/project_structure.md). Implementation evidence and remaining work live in [server progress](server/readme/serverProgress.md), [mobile plan](mobile_app/readme/mobilePlan.md) and [mobile progress](mobile_app/readme/mobileProgress.md). Documentation directories are eligible for Git tracking; environment files and generated outputs remain ignored.
