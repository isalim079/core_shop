# Core Shop server — phase plan and progress

Source: [full project specification](../../readme/project_structure.md).
Created: 2026-10-16. This document records the server phase plan and implementation/review progress. The current ignore rules allow `readme/` to be versioned; include it in a commit to share this record.

## How we will work

1. Implement exactly one phase at a time.
2. Record the changes, commands, verification results, limitations, and review items here.
3. Stop for the owner's review after each phase. Do not start the next phase until the owner asks to continue.
4. A phase is accepted only after review, even when automated checks pass.
5. Update this file whenever scope or decisions change. Never describe a planned capability as implemented.

Current checkpoint: **Phase 5 implemented and verified; owner review pending.**
Next phase: **Phase 6 — catalog and trading parties**, only after Phase 5 acceptance.
Phase 4 accepted when the owner requested the next phase. Live SMTP/Google settings and SMS selection remain pending operational configuration.
Phase 3 accepted by the owner when requesting the next phase. Phase 4 resumed on 2026-10-17 with Google/email/phone, passwords after initial verification, SMTP email, and SMS provider selection pending.
Phase 2 accepted by the owner when authorizing Phase 3 and selecting Cloudflare R2 on 2026-10-16.
Phase 1 accepted by the owner when authorizing Phase 2 on 2026-10-16.

## Architectural baseline

- One NestJS API serves web and mobile. Start with a modular monolith, using Fastify.
- Node.js 24 LTS, strict TypeScript, Yarn Classic to match the existing mobile workflow. The server has its own package manifest and lockfile; no repository restructuring is needed now.
- PostgreSQL/Prisma are integrated. Cloudflare R2 is the selected private object store; cloud API calls remain in the files phase. Redis/BullMQ remain scheduled integrations; Phase 4 authentication uses shared PostgreSQL rate buckets.
- Organization is the tenant boundary; branches narrow access within an organization. Never authorize from a client-supplied organization identifier alone.
- Inventory is an immutable movement ledger plus transactionally maintained balances. Weighted-average costing is the proposed default, and historical sale costs must remain reproducible.
- Money uses exact decimals. Timestamps are UTC, public IDs are opaque, lists are bounded, and errors expose stable codes plus a request ID.
- Retry-prone financial commands use idempotency. Mobile synchronization never overrides the server's business invariants.
- Business routes use `/api/v1`. `/health` is process liveness; implemented `/ready` checks database/schema/runtime privileges.
- Canonical specification v0.2 requires English/Bangla UI/errors/documents and immutable receivable/payable Baki ledgers. See tracked API/security, upload and credit-ledger designs.
- The complete product document remains authoritative. Unresolved product decisions remain explicit rather than silently invented.

## Phase overview

| Phase | Deliverable | Status |
| --- | --- | --- |
| 1 | Runnable server foundation, environment files, folder structure and tooling | Accepted |
| 2 | Tenant/permission/domain design and PostgreSQL/Prisma foundation | Accepted |
| 3 | Shared API infrastructure and security foundation | Accepted |
| 4 | Identity, authentication and session lifecycle | Accepted; live provider setup pending |
| 5 | Organizations, memberships, permissions and branches | Verified; owner review pending |
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
- [x] Ignore local/production environment files, dependencies, build output and logs.
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

### What existed at Phase 1 verification

The following paragraph records the Phase 1 checkpoint; the current Phase 2 source is summarized above. At that checkpoint, `HealthModule` was the only feature module registered in the application. The remaining domain folders contain `.gitkeep` placeholders, not business logic. No database connection, Prisma schema, migration, authentication, queue worker, billing provider or deployment is active. `.env.production` is a non-secret template, not evidence of production readiness. `DATABASE_URL` and `REDIS_URL` are validated but unused by the application in this phase. Local PostgreSQL database/user `core_shop` and the existing Redis service were verified separately, and their URLs are saved in ignored `.env.local`. No application database or Redis integration exists yet.

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
    serverProgress.md          # Versionable plan and review record
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
| Ignore rules (historical) | `.env.local`, `.env.production` and `readme/serverProgress.md` were ignored; `.env.example` trackable. Documentation ignore rule removed in the later requested update. |

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
- Phase 2 accepted when the owner authorized Phase 3. Financial precision/tax/rounding details remain subject to the assigned feature reviews; Phase 3 supersedes the original S3 version-ID assumption with an R2-compatible final-key model.

## Phase 3 — shared API and security foundation

Deliverables:

- Global DTO validation, strict bounds, pagination, allowlisted query operators, API versioning and OpenAPI contracts.
- Domain error codes, safe global exception responses, request IDs, structured logs and sensitive-data redaction.
- Authentication/permission guard interfaces, tenant context and repository scoping conventions ready for the auth and organization phases.
- Security headers, proxy trust configuration, rate-limit foundation and explicit CORS behavior, verified with the Fastify adapter.
- Audit event persistence and a transaction strategy for sensitive state changes.
- Define idempotency storage and command transaction boundaries before financial routes exist.

Acceptance: malformed input is rejected; unknown errors reveal no internals; secrets are scrubbed from logs; request IDs correlate responses and diagnostics; OpenAPI accurately describes implemented endpoints.

### Phase 3 implementation and verification — 2026-10-16

- Read canonical root `readme/project_structure.md` v0.2 and this progress record. Carried English/Bangla, Unicode preservation, Baki account/ledger/allocations/reversals, durable offline commands, bilingual document modes and expanded permissions into tracked implementation/design boundaries.
- Added strict global DTO validation, bounded pagination/cursors, explicit sort allowlists and typed OpenAPI health/readiness/error schemas. Unknown fields and rejected values are not echoed.
- Added shared stable error codes and English/Bangla boundary messages, server-generated UUID request IDs, no-store responses and structured allowlisted logs. Unknown exceptions, parser/size failures, 404s and 429s expose no raw internal details. Logging tests caught and fixed Pino's implicit exception-message behavior.
- Added security headers (production HSTS/CSP, development Swagger-compatible CSP), exact CORS headers/methods, explicit trusted proxy IP/CIDR configuration and bounded per-process IP rate limiting covering unknown routes. Redis-distributed/account-specific limits are not claimed.
- Added default-deny authentication guard and an IdentityVerifier seam that currently authenticates nobody. No fake token/header login exists. Tenant guard resolves active user/organization/membership, known permissions, roles and allowed branches from PostgreSQL. Request scopes are server-owned/immutable and sensitive transactions revalidate/lock authorization rows.
- Added an additive migration for user preferred language, append-only tenant-scoped audit evidence, immutable durable command results, and transactional outbox events. Runtime cannot rewrite audit/outbox evidence or permission/platform/migration records.
- Added serializable command transactions with canonical payload hashes, actor/tenant/operation/key uniqueness, target/branch scope, authorized replay, payload-mismatch conflicts, bounded serialization/deadlock retries and atomic business/audit/outbox/result rollback. Incomplete PROCESSING claims cannot commit. No automatic deduplication TTL is installed.
- Cloudflare R2 selected. Corrected Phase 2's versioning assumption: reservations retain quarantine keys; verified bytes receive a separate owner/file/hash final key with source/final ETags. No S3 version ID is required. Database guards make finalized identity immutable. Optional grouped R2 settings and safe account-derived endpoint configuration added; no cloud calls, bucket provisioning or upload/download endpoint implemented.
- Reference seed now upserts 38 permission definitions, including customer/supplier records, ledger/payment access, financial reports, adjustment/reversal and payment methods. It grants no memberships or users.
- `yarn run check` passed Prisma validation/generation, lint, application/tool typechecks, 20 isolated/HTTP/security tests and build.
- `yarn test:integration` passed 13 PostgreSQL tests on a fresh disposable database after applying both migrations and seeding twice. Includes real HTTP tenant-guard checks, cross-tenant audit/role/branch boundaries, authorization revocation before replay, concurrent duplicate command serialization, rollback, evidence restrictions and R2 metadata without version IDs. Disposable resources cleaned by the runner.
- Applied the tested additive migration to the local `core_shop` database, refreshed restricted grants and seeded permissions. Real HTTP `/health`, `/ready`, `/api-docs`, `/api-docs-json` returned 200; Bangla errors/correlation IDs/security headers/OpenAPI schemas verified. Verification server stopped. No production or R2 resources touched.
- Updated project/server READMEs, canonical R2 provider selection, `.env.example`, local non-secret defaults and tracked guides: `docs/api-security.md`, `docs/credit-ledger-design.md`, `docs/uploads.md`.
- Remaining boundaries: real credentials/session verification, registration/preferences and tenant business routes await Phases 4/5; finance models/posting await their domain phases; RLS read policies, distributed/account-specific limiting, storage verification and worker delivery require their assigned integration and negative tests. At this historical checkpoint, Phase 4 had not started; see its implementation record below.
- Phase 3 accepted when the owner requested the next phase.

## Phase 4 — identity and authentication

Implemented 2026-10-17. Owner decisions: email and phone use passwords after initial contact verification; Google sign-in is supported; email delivery uses SMTP; SMS vendor and Google client IDs remain to be supplied.

- Added registration/contact verification, password login/reset, authenticated contact/provider linking, safe profile/preferences, and session listing/revocation/logout.
- Passwords use bounded Argon2id; short-lived codes use keyed hashes with single-use/purpose/attempt checks. Passwords are selected after contact proof. Unknown/existing verification requests share a delivery path and generic response.
- Added opaque access/refresh sessions, fixed expiry, refresh rotation with retained history and family revocation on replay. User locks serialize reset/link/refresh, with recent-session checks inside linking transactions.
- Defined mobile bearer/secure-storage transport and browser HttpOnly cookies with production Secure prefixes, exact Origin, CSRF, origin-protected CSRF restoration and credentialed CORS.
- Added Google public-key ID-token verification against allowed audiences and single-use nonces. Matching email never merges accounts automatically; Gmail/Workspace can onboard directly, other addresses first verify locally and explicitly link.
- Added additive third migration, restrictive runtime grants, irreversible revocation/consumption triggers, shared IP/contact/challenge rate buckets, append-only auth audit evidence, readiness probes and owner-only expiry cleanup SQL.
- Added SMTP delivery with TLS/timeouts. SMS defaults to unavailable pending vendor choice; missing provider settings fail closed. No cloud accounts, real messages or default users were created.
- Generated a private local AUTH_SECRET and added blank provider settings without replacing existing credentials. Updated root/server READMEs and tracked auth/security/database guides.
- Validation: `yarn run check` passed (Prisma validation/generation, lint, source/tool typechecks, 21 isolated/HTTP tests and build); `yarn test:integration` passed 25 disposable PostgreSQL tests. Applied the additive migration and runtime grants to local core_shop; schema is current, `/health` and `/ready` return 200, unauthenticated `/api/v1/auth/me` returns 401, and development Swagger exposes 17 auth paths. Live SMTP/SMS/Google client smoke tests require provider configuration.

Review boundary: identity APIs are implemented; Phase 5 tenant business APIs, image uploads/R2 operations, UI API wiring and deployed delivery infrastructure remain outside this phase. Registration/profile images continue to use the established private-file metadata design until Phase 13.


Deliverables: user lifecycle, registration, Argon2id password hashing, login, verification, password reset, refresh-token rotation, session revocation and abuse controls. Decide email/phone onboarding and verification provider before integrating a provider. Define token/session transport for web and mobile separately where needed. Authentication events are audited; credentials and tokens are never logged or stored in plaintext.

Acceptance: valid flows work; expired tokens, replayed refresh tokens, revoked sessions and brute-force attempts are handled; reset/verification responses avoid account enumeration; auth integration tests pass.

## Phase 5 — organizations, access and branches

Implemented 2026-10-17; owner accepted Phase 4 by authorizing this phase. Provider credentials/SMS vendor remain explicit pending setup, not fabricated integration claims.

- Added atomic organization + owner + MAIN branch + five permission-backed role bundles, user-scoped creation idempotency, valid currency/timezone/precision, safe organization settings and bounded personal organization lists.
- Added current organization/branch context with required path/header agreement, explicit permission metadata and branch-filtered reads. No client-selected tenant or role name grants authority.
- Added owner-only custom role creation/edit/archive, administrative delegation limits, safe staff listings, membership suspension/revocation/reinstatement and immediate current-state access checks.
- Added contact-bound seven-day invitations, verified-recipient incoming/accept flows, pending uniqueness, creator-right revalidation, replay-safe acceptance and revocation. In-app invitations work without outbound providers; outbox contains scoped IDs for future delivery workers. Automatic invitation emails/SMS are not implemented in this phase.
- Added branch create/update/archive, stable codes, concurrent last-branch retention and verified-file shop logo/cover binding. R2 upload/scan/signed-URL endpoints remain Phase 13.
- Added recent-authenticated owner transfer with explicit former-owner roles, ALL-branch target ownership, no implicit admin promotion, and atomic audited changes retaining an active owner.
- Added a fourth additive migration, invitation identity/terminal/reference constraints, retained-branch and financial-setting protections, scoped runtime grants and readiness probes. Runtime cannot delete invitations or modify onboarding command evidence.
- Standardized organization-first lock order for authorization and metadata commands, using serializable retries and existing command/audit/outbox infrastructure. Read revalidation prevents stale scopes from authorizing changes.
- Fixed an adapter UTC-session mismatch discovered by SQL expiry tests: pool sessions now force UTC and readiness checks it. Added regression coverage against real database epoch/timestamps. The local application database had zero users, sessions, organizations and files; no data rewrite or deletion was required.
- Updated root/server README, API/security/database operations, and the [organization/access guide](../docs/organizations-and-access.md). No mobile files, external messages, cloud accounts or business example data were changed.

Validation and local upgrade: `yarn run check` passed Prisma validation/generation, lint, source/tool typechecks, 21 isolated/HTTP tests and build. `yarn test:integration` passed 44 disposable PostgreSQL tests, including 19 organization/access/UTC scenarios. Applied the fourth migration and restricted runtime grants locally, repeated the 38-permission seed without creating users/business examples, and confirmed the schema is current. Local `/health` and `/ready` return 200; unauthenticated organization/incoming-offer routes return 401. Development Swagger exposes 18 organization paths and documents required tenant/idempotency headers. Review covers organization onboarding/settings, role/delegation policy, invitation semantics, branch/owner retention and client context contracts. Phase 6 is not started.


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

Deliverables: private Cloudflare R2 storage through its S3-compatible API, scoped file metadata, upload size/type controls, safe short-lived download URLs, CSV/PDF exports and provider-neutral notifications. Introduce Redis/BullMQ, worker lifecycle, bounded retries/backoff, job ownership, failure visibility and idempotency. Queue heavy work and keep customer data out of diagnostic logs.

Acceptance: unauthorized file/job access fails; URLs expire; exports respect tenant and permission scope; retrying jobs does not duplicate notifications or outputs; queues/dependencies contribute honestly to readiness where required.

## Phase 14 — platform administration and support

Deliverables: separate platform authorization, organization/subscription metadata, plan administration, aggregate operational metrics, security events and support workflows. Business data remains restricted by default. Design break-glass support with elevated authentication, explicit reason, narrow scope, expiry and immutable auditing.

Acceptance: normal platform support cannot browse tenant transactions; all exceptional access is scoped, expiring and auditable; customer roles cannot call platform administrative APIs.

## Phase 15 — deployment and launch verification

Deliverables: containers, separate API/worker processes, private PostgreSQL/Redis, Nginx/TLS, environment/secret injection, staging separation, CI quality gates, reviewed migration rollout, immutable releases, rollback, encrypted backups and a verified restore procedure. Set RPO/RTO, retention, deletion/export policy and operational ownership. Add metrics/alerts, dependency/image checks and realistic load/tenant-isolation tests. Assess relevant OWASP ASVS Level 2 controls and track unresolved findings.

Acceptance: staging deployment and rollback verified; restored data reconciles; no secrets are tracked; auth/tenant/security checks pass; realistic p95 targets and queue behavior are measured. Production release requires explicit owner approval, real credentials and completed launch checklist; this phase is not automatic authorization to deploy.

## Phase 16 — post-MVP work

Choose one reviewed increment at a time: richer barcode/import flows, advanced analytics beyond required core aging, serial/batch/expiry industry capabilities, richer offline conflict/device management, integrations or measured scaling work. Do not add microservices or reporting replicas before measured demand justifies them.

Acceptance: each selected increment gets its own scope, migration/API effects, validation and review checkpoint before implementation.

## Bilingual and credit-ledger scope integration — 2026-10-16

State: requirements/design documentation updated; business implementation **Not started**. The existing NestJS/Fastify modular monolith, PostgreSQL/Prisma, Redis/BullMQ, permission catalog and tenant boundaries remain authoritative. No business table/endpoint is claimed from this update.

| Existing phase | Required additions / verification |
| --- | --- |
| 2 | Design `LedgerAccount`, immutable `LedgerEntry`, rebuildable `LedgerBalance`, `OpenItem`, `PaymentMethod`, `Payment`, `PaymentAllocation`, non-cash `LedgerSettlement`, durable command/outbox and scoped source FKs. Add `User.preferred_language` en/bn via future reviewed migration; current Prisma User has no locale field. No party due field as truth. |
| 3 | Stable translated error-key contract and safe parameters, locale boundary, durable financial idempotency/payload hash, atomic posting/audit/outbox convention; no translated domain enums. |
| 4–5 | Authenticated preference persistence and tenant/branch permission resolution; extend existing permission catalog/seeds, never add a competing ACL system. |
| 6 | Unicode Bangla names/notes/addresses/categories/brands and parameterized indexed search for both languages; archive referenced parties and methods. |
| 8 | Supplier purchase full payable + separate payment/allocations + stock/cost atomically; opening balance, purchase returns, adjustments, statements and supplier payment. |
| 9 | Customer opening balance, full-sale receivable, collections, returns/refunds, adjustments/reversals and statements. Serialize concurrent payments; exact decimals and allocation limits; source-event uniqueness. |
| 10 | Six dashboard KPIs, total/party receivables/payables, aging, collection, credit sales, purchase payable and statements; timezone/as-of/branch filters, snapshot consistency and English/Bangla output. |
| 12 | Offline credit sales and practical customer/supplier collection commands; stable IDs, dependency ordering, current permission checks, acknowledgement/replay and visible conflicts. Never overwrite financial history or lose pending money movements. |
| 13 | Core English/Bangla/bilingual invoice/payment receipt/statement generation, shaping/fonts, private exports, due lists/eligibility and provider-neutral reminder adapters. WhatsApp/SMS/email/payment-link delivery is optional future scope. |
| 15 | Ledger reconciliation, duplicate/concurrent payments, reversals, historical aging, rollback, Unicode exports and cross-tenant/branch authorization regression gates. |

Permissions to add using the existing global Permission catalog and tenant RolePermission bindings:

```text
CUSTOMER_VIEW CUSTOMER_CREATE CUSTOMER_EDIT CUSTOMER_DELETE
CUSTOMER_LEDGER_VIEW CUSTOMER_PAYMENT_CREATE
SUPPLIER_VIEW SUPPLIER_CREATE SUPPLIER_EDIT SUPPLIER_DELETE
SUPPLIER_LEDGER_VIEW SUPPLIER_PAYMENT_CREATE
REPORT_RECEIVABLE_VIEW REPORT_PAYABLE_VIEW
LEDGER_ADJUSTMENT_CREATE LEDGER_REVERSAL_CREATE PAYMENT_METHOD_MANAGE
```

These are required design codes, not a claim the current seed already includes them. `EXPORT_DATA` supplements document/report permissions. All lookups, allocations, replay results, workers and downloads enforce authenticated organization and permitted branch context; body/query organization IDs never authorize access. Restrict immutable-table runtime mutations, use linked reversals, and redact payment details from diagnostic logs.

English/Bangla are core V1 requirements. Keep server values/enums and decimal/date serialization canonical; localize errors/document templates at boundaries using versioned keys and explicit supported locale. Receivable/payable calculations never branch by locale. The canonical specification defines signs, settlement allocation, returns/refunds, opening/current/running balances, unknown-due aging and offline reconciliation.

### Documentation verification — 2026-10-16

The four-section specification retains all 65 baseline subsections and adds explicit business workflows. Seven Markdown files passed fence/link checks (26 relative links); the root canonical move and non-ignored documentation status were verified. Mobile `npx expo lint` and `npx tsc --noEmit` passed, with two existing hook warnings. No server runtime code changed and no new server test run is claimed; existing Phase 2 verification evidence remains authoritative for that phase.

### Observed source and limits

Observed `prisma/schema.prisma`, migration `20261016000100_identity_tenant_files`, seed, database service, readiness controller and `docs/database-design.md`. They establish source presence for Phase 2 and describe its existing scope; they do not implement the new finance/locale requirements. Prior Phase 1 command results below remain historical. This documentation session does not change runtime code, schema, migration, seed or the pre-existing uncommitted server work, and does not claim database verification or Phase 2 acceptance.

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
| 2026-10-16 | 2 | Prisma, lint, typecheck, 11 isolated tests, 9 PostgreSQL integration tests, build, local migration/seed, real HTTP health/readiness/Swagger passed | Accepted; owner authorized Phase 3 |
| 2026-10-16 | 3 | Prisma, lint, typechecks, 20 isolated/HTTP tests, 13 PostgreSQL tests, build, local additive migration/seed and real HTTP verification passed | Accepted; owner requested the next phase |
| 2026-10-17 | 4 | Prisma, lint, typechecks, 21 isolated/HTTP tests, 25 PostgreSQL tests, build, local additive migration/grants, health/readiness/Swagger passed | Accepted; owner requested Phase 5; live provider setup pending |
| 2026-10-17 | 5 | Prisma, lint, typechecks, 21 isolated/HTTP tests, 44 PostgreSQL tests, build, local additive migration/grants/seed, readiness and Swagger passed | Owner review pending |

## Technical references

- [NestJS first steps](https://docs.nestjs.com/first-steps)
- [NestJS Fastify adapter](https://docs.nestjs.com/techniques/performance)
- [NestJS configuration and validation](https://docs.nestjs.com/techniques/configuration)
- [Prisma generator/version guidance](https://www.prisma.io/docs/orm/prisma-schema/overview/generators) — verify again when Phase 2 begins.
