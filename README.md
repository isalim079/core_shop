# Core Shop

A business management platform for small and medium retail businesses, bringing sales, purchasing, inventory, customers, suppliers, expenses, and reporting into one system for web and mobile.

Core Shop is being developed as a multi-tenant SaaS platform. One shared backend will serve the web and mobile applications, with organizations and branches forming the foundation for business data isolation and staff access.

## Project status

**In active development. Server Phase 1 is implemented and verified.**

| Component | Current state |
| --- | --- |
| Server | NestJS and Fastify foundation with environment validation, health endpoint, and development Swagger |
| Mobile | React Native / Expo application workspace; see its source and setup guide for current functionality |
| Web | Reserved directory; implementation has not started |
| Database | PostgreSQL is planned as the source of truth; Prisma integration and schema design are next |
| Background services | Redis and BullMQ integration is planned |

The server currently has no business endpoints, authentication, tenant authorization, or application database connections. Product capabilities below describe the intended platform rather than completed functionality.

## Product vision

Core Shop aims to give retailers one place to manage daily operations across their shops and branches. A shared commerce core will support different retail categories through configurable products, variants, units, and business settings.

| Area | Planned capabilities |
| --- | --- |
| Organizations and access | Business accounts, branches, memberships, roles, and permissions |
| Product catalog | Products, variants, categories, brands, units, SKUs, and barcodes |
| Inventory | Stock ledger, balances, adjustments, transfers, and low-stock visibility |
| Purchasing | Suppliers, purchase receipts, payments, returns, and payables |
| Sales | Invoices, discounts, payments, returns, and customer receivables |
| Finance | Expenses, stock valuation, dashboards, and reproducible profit reports |
| Platform services | Subscription plans, entitlements, notifications, exports, and audit records |
| Mobile operations | Selected offline sales and inventory workflows with synchronization |

## Repository structure

```text
core_shop/
├── README.md       # Project overview
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
| Database | PostgreSQL and Prisma | Planned application integration |
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

The copy command preserves an existing `.env.local`. Review that file before starting the server. PostgreSQL and Redis are not required to run the current server foundation.

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

Swagger is disabled in production and test modes. `/health` checks process liveness; it does not verify dependencies or business readiness. Future business endpoints will use `/api/v1`.

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

Run the backend quality checks from `server/`:

```bash
yarn run check
```

This runs lint, TypeScript checking, automated tests, and the build. Current tests cover environment selection and validation, CORS, health responses, unavailable routes, and Swagger access across runtime modes.

Keep credentials in ignored environment files or deployment secret configuration. Commit safe examples only. Production deployment, authentication, dependency readiness, monitoring, and backups remain future work.

## Roadmap

Development proceeds in reviewed phases:

1. **Server foundation** — implemented and verified.
2. **Database and tenant design** — PostgreSQL, Prisma, domain relationships, and readiness checks.
3. **API and security foundation** — validation, errors, logging, authorization interfaces, and audit infrastructure.
4. **Identity and business access** — authentication, organizations, memberships, and branches.
5. **Commerce workflows** — catalog, customers, suppliers, inventory, purchasing, sales, and payments.
6. **Business insights and platform features** — expenses, reports, plans, and entitlements.
7. **Extended services** — mobile synchronization, files, exports, workers, and platform administration.
8. **Launch preparation** — deployment, monitoring, backups, recovery, and operational verification.

Detailed product and engineering notes also exist in local `readme/` directories. Those directories may be ignored by Git and unavailable in fresh clones; the tracked READMEs provide the repository's public-facing setup and status information.
