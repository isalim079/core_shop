# Core Shop server — phase plan and progress

Source: [full project specification](../../readme/project_structure.md).
Created: 2026-10-16. This document records the server phase plan and implementation/review progress. The current ignore rules allow `readme/` to be versioned; include it in a commit to share this record.

## How we will work

1. Implement exactly one phase at a time.
2. Record the changes, commands, verification results, limitations, and review items here.
3. Stop for the owner's review after each phase. Do not start the next phase until the owner asks to continue.
4. A phase is accepted only after review, even when automated checks pass.
5. Update this file whenever scope or decisions change. Never describe a planned capability as implemented.

Current checkpoint: **Phase 2 implemented and verified. Owner review pending.**
Next phase: **Phase 3 — shared API and security foundation**, only after Phase 2 acceptance.
Phase 1 accepted by the owner when authorizing Phase 2 on 2026-10-16.

## Architectural baseline

- One NestJS API serves web and mobile. Start with a modular monolith, using Fastify.
- Node.js 24 LTS, strict TypeScript, Yarn Classic to match the existing mobile workflow. The server has its own package manifest and lockfile; no repository restructuring is needed now.
- PostgreSQL and Prisma are the planned source of truth. Redis and BullMQ come when their features are implemented.
- Organization is the tenant boundary; branches narrow access within an organization. Never authorize from a client-supplied organization identifier alone.
- Inventory is an immutable movement ledger plus transactionally maintained balances. Weighted-average costing is the proposed default, and historical sale costs must remain reproducible.
- Money uses exact decimals. Timestamps are UTC, public IDs are opaque, lists are bounded, and errors expose stable codes plus a request ID.
- Retry-prone financial commands use idempotency. Mobile synchronization never overrides the server's business invariants.
- Start business routes at `/api/v1`. `/health` is process liveness only; dependency readiness is a separate later endpoint.
- The complete product document remains authoritative. Unresolved product decisions remain explicit rather than silently invented.

## Phase overview

| Phase | Deliverable | Status |
| --- | --- | --- |
| 1 | Runnable server foundation, environment files, folder structure and tooling | Accepted |
| 2 | Tenant/permission/domain design and PostgreSQL/Prisma foundation | Verified; owner review pending |
| 3 | Shared API infrastructure and security foundation | Not started |
| 4 | Identity, authentication and session lifecycle | Not started |
| 5 | Organizations, memberships, permissions and branches | Not started |
| 6 | Catalog and customer/supplier records | Not started |
| 7 | Inventory ledger and weighted-average costing | Not started |
| 8 | Purchasing and supplier payables | Not started |
| 9 | Sales, payments, returns and receivables | Not started |
| 10 | Expenses, dashboards and reproducible reports | Not started |
| 11 | Plans, entitlements and subscription foundation | Not started |
| 12 | Mobile offline commands and synchronization | Not started |
| 13 | Private files, exports, notifications and background jobs | Not started |
| 14 | Platform administration and controlled support access | Not started |
| 15 | Deployment, operations and launch verification | Not started |
| 16 | Post-MVP capabilities selected by business priority | Not started |

## Phase 1 — server foundation (accepted; historical implementation record)

Goal: provide an application that starts and can be reviewed before business functionality is added.

### Implementation checklist

- [x] Initialize a separate private server package with NestJS 12 and the Fastify adapter.
- [x] Configure Node 24, strict TypeScript, Nest build/watch, ESLint, typecheck and test commands.
- [x] Create `.env.local`, `.env.production`, and a safe, tracked `.env.example`.
- [x] Ignore local/production environment files, the `readme/` folder, dependencies, build output and logs.
- [x] Select local versus production configuration explicitly; never load local credentials during tests or production.
- [x] Centralize environment loading and validation in `src/config/`; validate runtime mode, host, port, CORS origins and optional PostgreSQL/Redis URLs without exposing values in errors.
- [x] Provide development-only Swagger UI at `/api-docs`, with JSON at `/api-docs-json`; verify UI, assets and documents are unavailable in production and tests.
- [x] Add the `GET /health` liveness endpoint.
- [x] Reserve `/api/v1` for business routes and configure explicit browser CORS origins.
- [x] Enable shutdown hooks and a bounded JSON request body.
- [x] Create module, infrastructure, migration and test folders.
- [x] Document module responsibilities, environment rules, startup and review commands.
- [x] Finish automated checks and record their results below.
- [x] Owner reviews and accepts Phase 1; authorized Phase 2.

### What exists now

`HealthModule` is the only feature module registered in the application. The remaining domain folders contain `.gitkeep` placeholders, not business logic. No database connection, Prisma schema, migration, authentication, queue worker, billing provider or deployment is active. `.env.production` is a non-secret template, not evidence of production readiness. `DATABASE_URL` and `REDIS_URL` are validated but unused by the application in this phase. Local PostgreSQL database/user `core_shop` and the existing Redis service were verified separately, and their URLs are saved in ignored `.env.local`. No application database or Redis integration exists yet.

### Folder structure

```text
server/
  .env.example                 # Tracked, non-secret template
  .env.local                   # Ignored local configuration
  .env.production              # Ignored production template
  .gitignore
  .nvmrc
  package.json
  yarn.lock
  nest-cli.json
  eslint.config.mjs
  tsconfig.json
  tsconfig.build.json
  tsconfig.test.json
  README.md                    # Tracked setup and ownership guide
  readme/
    serverProgress.md          # This ignored plan and review record
  src/
    main.ts                    # HTTP listener and startup failure boundary
    app.ts                     # Fastify, API prefix, CORS, shutdown
    app.module.ts              # Configuration and actual feature registrations
    config/                    # Environment selection, validation, global config module, Swagger
    common/
      errors/ guards/ interceptors/ pipes/ decorators/
      logging/ crypto/ pagination/
    database/                  # Future Prisma service and DB lifecycle
    health/                    # Implemented process liveness
    auth/ users/
    organizations/ memberships/ branches/
    catalog/
      products/ variants/ categories/ brands/ units/
    customers/ suppliers/
    inventory/ purchases/ sales/ returns/ payments/ expenses/
    reports/ analytics/
    subscriptions/ entitlements/ billing/ ads/
    notifications/ audit/ exports/ files/ sync/ admin/ jobs/
  prisma/
    migrations/                # Future reviewed migrations; no schema yet
  test/
    environment.test.ts
    health.test.ts
    swagger.test.ts
    integration/
    e2e/
  scripts/
    start-production.cjs
    database/
  infrastructure/
    docker/
    nginx/
```

Empty folders will receive real implementations only in their assigned phase. Remove `.gitkeep` when a folder gains tracked source files. Domain modules keep their controllers, DTOs, services, repositories and tests close together as those files become necessary; do not pre-generate empty classes.

### Environment rules

| Execution | File | Rule |
| --- | --- | --- |
| `yarn start:dev` / `yarn start` | `.env.local` by default | Defaults to development unless NODE_ENV is explicitly set |
| `yarn start:prod` | `.env.production` if present | Startup wrapper sets NODE_ENV to production before loading the app |
| Tests | No environment files | Tests use isolated configuration and never load local credentials |
| All modes | OS/container environment | Explicit process values take precedence over file values |

Run commands from `server/`. Only `.env.example` is tracked. There are no real production credentials in any generated template. File permissions for `.env.local` and `.env.production` are set to owner-only where the filesystem supports them.

`HOST=0.0.0.0` allows a physical phone on the same trusted LAN to connect to the development computer's IP. `localhost` on a phone refers to the phone itself. Restrict LAN/firewall exposure as appropriate for development. CORS is a browser policy, not API authorization; native mobile clients do not need a browser origin. Local web defaults are port 5173 and Expo web port 8081; change them to the actual web dev server origin when that project is initialized. Empty CORS origins disable browser cross-origin access; production browser origins must be exact HTTPS origins.

### Manual review

```bash
cd /media/srs/SRS1/personal/my_project/core_shop/server
yarn install --frozen-lockfile
yarn run check
yarn start:dev
```

In another terminal:

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"core-shop-server"}
```

The health endpoint proves only that the API process is responding. It does not verify the database, Redis, migrations or business readiness. Unknown routes, including business endpoints, currently return 404.

Production entry-point smoke check, after building (local verification only):

```bash
yarn build
yarn start:prod
```

### Verification record

Verified on 2026-10-16 with Node 24.16.0 / Yarn 1.22.22:

| Check | Result |
| --- | --- |
| Dependency installation and lockfile | Passed; `yarn.lock` generated |
| `yarn lint` | Passed with ESLint 10 and typescript-eslint |
| `yarn typecheck` | Passed |
| `yarn test` | Passed, 8 tests: environment file isolation, invalid ports, connection URLs, CORS, HTTP liveness/unknown routes, Swagger UI/assets/documents in development and disabled in production/test |
| `yarn build` | Passed |
| Development entry point | Real HTTP `/health` returned 200 on an ephemeral loopback port |
| Production entry point | Real HTTP `/health` returned 200 on an ephemeral loopback port |
| Process overrides | HOST/PORT and CORS origins respected in both startup modes |
| Ignore rules | `.env.local`, `.env.production` and `readme/serverProgress.md` ignored; `.env.example` trackable |

Initial smoke-check processes were stopped after verification. A local `core_shop` PostgreSQL database and login were subsequently provisioned with owner authorization; TCP login and transactional table creation were verified. Redis TCP PING was verified. No production service was provisioned. `.env.local` now contains local credentials and is ignored by Git. The filesystem previously reported mode 777 despite `chmod(600)`; owner-only POSIX permissions are not enforced on this mount.

### Owner review checkpoint

- Confirm the folder organization and phased scope.
- Confirm that the server starts and `/health` responds.
- Confirm environment templates contain the expected fields and are ignored correctly.
- Confirm Node 24 / Yarn / NestJS / Fastify are acceptable.
- Acceptance: **accepted when the owner authorized Phase 2**.

## Phase 2 — tenant design and database foundation

Deliverables:

- Document identity, organization, membership, branch, permission and platform-admin boundaries before creating routes.
- Design the core relationship diagram, lifecycle states, decimal precision, UTC timestamps, public identifiers, tenant-scoped uniqueness and composite references.
- Map the catalog, ledger, purchase, sale, payment, return, expense, entitlement and audit models. Review financial and stock invariants before implementation.
- Set up PostgreSQL for local development and Prisma with version-compatible configuration, generated client, lifecycle management, migration and deterministic reference seed commands.
- Add validated DATABASE_URL handling, private DB configuration, and `/ready` that checks real connectivity and schema compatibility; never return ready when required checks fail.
- Evaluate PostgreSQL RLS as defense in depth and record the decision; application tenant scoping remains mandatory.

Acceptance: schema/tenant design reviewed; migrations apply to an empty local database; client generation and seed succeed; database readiness fails when disconnected; no production database or destructive migration is used for testing.

### Phase 2 implementation and verification — 2026-10-16

- Pinned stable Prisma CLI/client/PostgreSQL adapter to 7.10.1, with generated CommonJS client, shared CLI/runtime configuration, bounded pools/statements, and shutdown cleanup.
- Added reviewed initial migration for users, organizations, memberships, scoped roles/permissions, branches, platform grants, private file records, avatars, and organization branding. Commerce entities and transaction/decimal rules are mapped in tracked design documentation; commerce tables/endpoints remain future work.
- Added composite tenant foreign keys, normalized identity/organization checks, timezone validation, deferred last-owner protection with concurrency serialization, and file ownership/lifecycle/readiness constraints.
- User/owner photos are user-owned. Shop logos/covers and future product images/invoice/receipt/document attachments are organization-owned. Source and processed object versions/sizes are separate. No storage connection or upload/download endpoint is exposed.
- Created restricted `core_shop_runtime` login. Preserved the original `core_shop` owner credential for migrations in ignored `.env.local`; application requests use the separate restricted URL. No production service was provisioned.
- Added public `/ready`: checks actual database/schema, complete expected migration history, and nonprivileged credentials; generic 503 on failure. `/health` remains liveness only.
- Seed upserts 21 reference permissions; no users, passwords, platform administrators, or tenant example data are seeded. Repeat runs verified.
- RLS evaluated and deferred until authenticated tenant context exists. Composite references do not provide read isolation. No tenant business routes are exposed; scoped repository/auth checks are mandatory before those routes are added.
- `yarn run check`: Prisma validation/generation, lint, typecheck, 11 isolated tests, and build passed.
- `yarn test:integration`: 9 real PostgreSQL tests passed against a freshly created disposable database. Includes cross-tenant roles/branches, owner transfer and concurrent last-owner removal, file ownership and lifecycle, forbidden runtime privileges, healthy/unreachable database, failed migration/missing table, and real HTTP readiness. Runner removes only its own database/login.
- Applied the tested migration to the previously empty local `core_shop` database and seeded permissions. Real HTTP `/health`, `/ready`, `/api-docs`, and `/api-docs-json` all returned 200; verification process stopped.
- Tracked review documents: `docs/database-design.md`, `docs/uploads.md`, and `docs/database-operations.md`. Root/server READMEs and `.env.example` updated.
- Owner review pending: tenant/owner semantics, proposed financial precision and rounding, file scope/limits/lifecycle, onboarding design, and RLS staging. Phase 3 has not started.

## Phase 3 — shared API and security foundation

Deliverables:

- Global DTO validation, strict bounds, pagination, allowlisted query operators, API versioning and OpenAPI contracts.
- Domain error codes, safe global exception responses, request IDs, structured logs and sensitive-data redaction.
- Authentication/permission guard interfaces, tenant context and repository scoping conventions ready for the auth and organization phases.
- Security headers, proxy trust configuration, rate-limit foundation and explicit CORS behavior, verified with the Fastify adapter.
- Audit event persistence and a transaction strategy for sensitive state changes.
- Define idempotency storage and command transaction boundaries before financial routes exist.

Acceptance: malformed input is rejected; unknown errors reveal no internals; secrets are scrubbed from logs; request IDs correlate responses and diagnostics; OpenAPI accurately describes implemented endpoints.

## Phase 4 — identity and authentication

Deliverables: user lifecycle, registration, Argon2id password hashing, login, verification, password reset, refresh-token rotation, session revocation and abuse controls. Decide email/phone onboarding and verification provider before integrating a provider. Define token/session transport for web and mobile separately where needed. Authentication events are audited; credentials and tokens are never logged or stored in plaintext.

Acceptance: valid flows work; expired tokens, replayed refresh tokens, revoked sessions and brute-force attempts are handled; reset/verification responses avoid account enumeration; auth integration tests pass.

## Phase 5 — organizations, access and branches

Deliverables: organization creation, ownership, memberships/invitations, role presets backed by permissions, branch management, branch access, organization settings and active-tenant selection verified against current memberships. Prevent privilege escalation and unsafe owner removal. Validate foreign keys and identifiers within the authorized tenant.

Acceptance: users can belong to different organizations with different permissions; cross-tenant and unauthorized branch requests fail consistently; cashier/admin/owner boundaries and audit events have negative integration tests.

## Phase 6 — catalog and trading parties

Deliverables: tenant-scoped products, default/multiple variants, categories, brands, units, SKU/barcode rules, archive behavior, bounded search and customer/supplier contact records. Configure currency/timezone/quantity precision. Plan optional serial/batch/expiry capabilities without adding unsupported workflows.

Acceptance: tenant uniqueness, default variants, search/pagination and archived-record rules pass; duplicate SKU/barcode and cross-tenant references are rejected; sensitive contact fields follow the agreed protection policy.

## Phase 7 — inventory and costing

Deliverables: immutable movements, materialized branch balances, opening stock, adjustments with reason/actor, transfers, reservations if needed and concurrency-safe transactions. Negative stock is disabled by default. Implement decimal weighted-average cost and stable historical costing references.

Acceptance: balance reconciles to movements; concurrent writes cannot oversell stock; transfers have matching scoped movements; adjustments require permission; rollback preserves both ledger and balance consistency. Critical costing and isolation tests pass.

## Phase 8 — purchasing

Deliverables: supplier purchase documents, receipt/posting lifecycle, line costs/discounts/tax rules, inventory receipts, weighted-average updates, supplier payments/payables and auditable reversals. Use idempotent posting and explicit transaction boundaries.

Acceptance: purchase, inventory and payable changes commit atomically; duplicates do not create stock twice; exact decimals and partial payments reconcile; unauthorized/cross-tenant supplier or SKU references fail.

## Phase 9 — sales, payments and returns

Deliverables: server-calculated invoices/totals, discounts, optional tax, line cost snapshots, payments, credit/receivables, idempotent sale commands, inventory consumption, voids/refunds and purchase/sale returns. Define invoice numbering and credit policy before completing workflows. Reversals preserve originals and audit history.

Acceptance: duplicate retries return the original result; no partial commercial/stock/payment writes survive failure; concurrent sales respect stock policy; over-refunds and invalid state changes fail; historical profit remains stable after future purchases.

## Phase 10 — expenses and reporting

Deliverables: expense categories/entries, daily dashboard, sales/purchase/inventory reports, receivables/payables, weighted-cost inventory valuation and reproducible gross/operating profit. Add date/branch/timezone scope, drill-down source data and permission-gated profit access.

Acceptance: reports reconcile against known fixtures including returns and discounts; exact decimal totals are correct; cashier cannot read profit; date/timezone and branch isolation are tested; bounded report performance is measured.

## Phase 11 — plans and entitlements

Deliverables: configurable plan definitions, feature/limit resolver, subscription state transitions, free/premium behavior and ads flag. Enforce limits on server writes. Review exact free-plan limits. Introduce payment-provider abstraction; implement actual billing integration only after provider selection, webhook/idempotency design and explicit scope review.

Acceptance: clients cannot bypass limits or spoof subscription state; feature decisions use trusted server state; concurrent limit checks work; plan transitions are tested. Do not claim payment-provider billing exists before it is implemented.

## Phase 12 — offline synchronization

Deliverables: a documented, versioned mobile command contract; device/client identifiers; idempotency keys; bounded push/pull; cursors/tombstones where needed; server versions; explicit conflicts and recoverable retry states. Begin with catalog/stock reading and sales creation. Recheck membership, permissions and stock rules on every submitted command.

Acceptance: intermittent connections, replayed requests, stale versions, revoked membership and conflicting sales have deterministic outcomes; no silent last-write-wins corruption; web/mobile API contracts agree. Coordinate client work separately from server implementation.

## Phase 13 — files, exports and workers

Deliverables: private S3-compatible storage, scoped file metadata, upload size/type controls, safe short-lived download URLs, CSV/PDF exports and provider-neutral notifications. Introduce Redis/BullMQ, worker lifecycle, bounded retries/backoff, job ownership, failure visibility and idempotency. Queue heavy work and keep customer data out of diagnostic logs.

Acceptance: unauthorized file/job access fails; URLs expire; exports respect tenant and permission scope; retrying jobs does not duplicate notifications or outputs; queues/dependencies contribute honestly to readiness where required.

## Phase 14 — platform administration and support

Deliverables: separate platform authorization, organization/subscription metadata, plan administration, aggregate operational metrics, security events and support workflows. Business data remains restricted by default. Design break-glass support with elevated authentication, explicit reason, narrow scope, expiry and immutable auditing.

Acceptance: normal platform support cannot browse tenant transactions; all exceptional access is scoped, expiring and auditable; customer roles cannot call platform administrative APIs.

## Phase 15 — deployment and launch verification

Deliverables: containers, separate API/worker processes, private PostgreSQL/Redis, Nginx/TLS, environment/secret injection, staging separation, CI quality gates, reviewed migration rollout, immutable releases, rollback, encrypted backups and a verified restore procedure. Set RPO/RTO, retention, deletion/export policy and operational ownership. Add metrics/alerts, dependency/image checks and realistic load/tenant-isolation tests. Assess relevant OWASP ASVS Level 2 controls and track unresolved findings.

Acceptance: staging deployment and rollback verified; restored data reconciles; no secrets are tracked; auth/tenant/security checks pass; realistic p95 targets and queue behavior are measured. Production release requires explicit owner approval, real credentials and completed launch checklist; this phase is not automatic authorization to deploy.

## Phase 16 — post-MVP work

Choose one reviewed increment at a time: richer barcode/import flows, advanced reports/aging, serial/batch/expiry industry capabilities, richer offline conflict/device management, integrations or measured scaling work. Do not add microservices or reporting replicas before measured demand justifies them.

Acceptance: each selected increment gets its own scope, migration/API effects, validation and review checkpoint before implementation.

## Definition of done for future features

- Business rules and API contract documented.
- Tenant scope and permissions enforced and tested with negative cases.
- Exact monetary and transactional invariants verified where relevant.
- Migrations/seeds reviewed and rollback/compatibility implications understood.
- Sensitive operations audited; error codes and redacted observability present.
- Appropriate unit/integration/API tests, lint, typecheck and build pass.
- Web/mobile coordination recorded without claiming clients were implemented here.
- Remaining risks/open decisions documented; owner review recorded before moving on.

## Decisions still requiring product input in their assigned phases

- Email versus phone onboarding and email/SMS provider.
- Credit limits, tax/invoice policy and financial precision requirements.
- Exact free/premium limits and billing provider.
- Data retention/deletion, backup RPO/RTO and production hosting.
- Key management and selective field-encryption scope.

Proposed defaults from the source: weighted-average costing, branch-aware stock, negative stock disabled, generic optional tax components, provider abstractions, and configurable entitlements.

## Review log

| Date | Phase | Automated checks | Owner decision |
| --- | --- | --- | --- |
| 2026-10-16 | 1 | Lint, typecheck, 8 tests and build passed after config centralization and development Swagger; earlier dev/prod HTTP smoke checks passed. Owner reports `/health` working. | Accepted; owner authorized Phase 2 |

| 2026-10-16 | 2 | Prisma, lint, typecheck, 11 isolated tests, 9 PostgreSQL integration tests, build, local migration/seed, real HTTP health/readiness/Swagger passed | Awaiting owner review |

## Technical references

- [NestJS first steps](https://docs.nestjs.com/first-steps)
- [NestJS Fastify adapter](https://docs.nestjs.com/techniques/performance)
- [NestJS configuration and validation](https://docs.nestjs.com/techniques/configuration)
- [Prisma generator/version guidance](https://www.prisma.io/docs/orm/prisma-schema/overview/generators) — verify again when Phase 2 begins.
