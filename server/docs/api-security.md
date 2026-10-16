# Phase 3: API and security foundation

## Scope

This phase implements the shared request boundary and authorization/transaction interfaces. Registration/login/session management belong to Phase 4; organization APIs and role administration belong to Phase 5. No test-only routes or fake authentication are registered by the production application.

Existing public routes are `/health` and `/ready`. Swagger and its assets remain development-only at `/api-docs`. All future Nest controller routes require authentication unless explicitly marked `@Public()`.

## API contract and validation

Business routes use `/api/v1`. Register concrete DTO classes and validation decorators for every body, query and parameter; TypeScript interfaces alone do not validate network input. The global pipe transforms DTO instances, rejects unknown fields and unknown object types, disables implicit primitive conversion, and never exposes rejected values or validator-generated prose.

`PaginationQueryDto` provides a default limit of 20, maximum 100, bounded cursor and an allowlisted direction. Subclasses add their own bounded fields. `allowedSort` selects only a feature's fixed database-field allowlist; never turn a client object directly into Prisma filters/order clauses. Unknown query operators fail DTO validation. Date ranges, batch lengths and monetary scales must be explicitly bounded by the relevant feature DTO.

Cursors are validated navigation data, not authorization credentials. Always scope cursor anchor lookups and page queries to the authorized tenant/branch. Ledger/report cursors will add their own effective-date/account-sequence and snapshot watermark fields; the generic created-at cursor is not a financial statement protocol.

Amounts in financial contracts remain canonical decimal strings; language changes must not alter money, event codes or business rules. Unicode user content is preserved. `User.preferredLanguage` stores `en` or `bn`; its authenticated preferences endpoint is future work.

## Errors and localization

All failures, including parser errors, unknown routes and rate limits, use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid.",
    "requestId": "4cc22b93-2e49-498f-a158-6b65ba851c93",
    "fields": [{ "field": "limit", "code": "MAX" }]
  }
}
```

Field details are optional. Unknown field names become `$` rather than echoing attacker-controlled input. Stable error/field codes are the machine contract; clients translate them with their own catalogs. Messages negotiate supported `Accept-Language` preferences (`en`, `bn`, including regional tags and quality weights), falling back to English. Responses include `Content-Language` and `Vary: Accept-Language`.

HTTP 400 covers malformed requests/DTOs; 401 missing authentication; 403 denied access; 404 unavailable resources; 409 state/idempotency conflicts; 413 oversized bodies; 415 unsupported content; 422 known business-rule failures; 429 throttling; and 503 dependency unavailability. Unknown exceptions return a generic 500. No SQL, stack, filenames, exception text, tokens, database names or submitted values enter error messages.

OpenAPI describes actual liveness/readiness responses and the shared error schema, including 503 readiness failures. Future endpoint contracts must document permissions, conflict cases and exact decimal fields before feature implementation.

## Correlation and diagnostic logging

Every request receives a server-generated UUID in `X-Request-Id`, including errors. Incoming request IDs are ignored. Log events and error responses carry the same ID. API responses use `Cache-Control: no-store`.

Structured JSON diagnostics retain only known event names, UUID request IDs, method, status, stable error code and duration. Raw URLs/parameters, query strings, bodies, headers, IP addresses, free-form log messages and implicit exception messages are omitted. Credential-field redaction and request/error serializers provide additional protection. Avoid ad hoc `console.log` or free-form messages containing user data. Audit evidence is a separate, controlled database record.

## Headers, proxy trust, CORS and rate limits

Nest/Fastify security headers apply to success, error and 404 responses. Production enables HSTS and strict default CSP. Development permits Swagger's inline initializer/styles and does not upgrade local HTTP resources to HTTPS. Deployment still owns external TLS and edge protection.

`TRUST_PROXY_CIDRS` defaults to empty (forwarded headers ignored). It accepts only explicit IP addresses/CIDRs. Configure the actual trusted ingress addresses and ensure that ingress replaces untrusted forwarding headers. Do not use broad public networks as proxy ranges. Cloudflare headers do not authenticate application users.

CORS uses exact configured origins, an explicit method/header set, no credentialed browser requests, and exposed request/retry headers. A disallowed origin receives no allow-origin header. CORS is not authentication. Cookie sessions, CSRF protection and credentialed CORS must be reviewed together when Phase 4 selects the web session transport.

The current limiter uses a bounded, per-process IP counter, including 404s. Defaults: 120 requests per 60 seconds; 429 includes `Retry-After`. IPv6 normalization is supplied by the plugin. Shared Redis-backed limits, account/destination-specific login/OTP rules and write-heavy tenant/user quotas must be added before multiple API replicas or authentication endpoints are deployed. The present limiter is not distributed and does not replace upstream DDoS controls.

## Authentication and tenant authorization

`IdentityVerifier` is the Phase 4 integration seam and currently returns no identity. `AuthenticationGuard` denies protected routes by default; it does not accept `X-User-Id`, a claimed tenant ID, arbitrary bearer strings, or body fields as proof of identity.

A verified principal provides only the actor and credential identifiers. `@RequirePermissions(...)` resolves organization selection from `X-Organization-Id`; `@RequireBranch()` also requires `X-Branch-Id`. These headers select a context, then the server validates current user, organization and membership status, known permissions, role grants and branch access in PostgreSQL. Owners remain within their own organization. A selected-branches membership with no grants has no branch access.

Request access context is stored in server-owned weak maps. Tenant scopes are immutable and issued by the authorization service. Protected writes must receive those scopes, not reconstructed objects from a DTO. `tenantWhere` intersects the tenant with feature filters; `branchWhere` adds selected/permitted branch restrictions. Use both for branch-owned data. These are repository conventions, not an automatic Prisma row filter: unscoped infrastructure queries still exist, and RLS remains deferred until the authenticated context is implemented and tested.

Before exposing business routes, replace the deny-all identity verifier with real credential/session verification, require appropriate permission metadata on every tenant operation, scope every repository query, and add negative tests. Do not put business routes behind `@Public()` to work around missing authentication.

## Atomic commands, audit and outbox

`CommandService.execute` accepts an issued permission-bearing scope, server-selected operation (including target account where applicable), UUID idempotency key, validated payload and server request ID. It:

1. Revalidates current user/membership/organization/roles/branch permissions inside a serializable transaction, locking relevant authorization rows.
2. Claims a database-unique organization + actor + operation + key and hashes a canonical payload including branch scope.
3. Replays the stored authorized result for an identical completed retry, or returns `IDEMPOTENCY_PAYLOAD_MISMATCH` for changed data.
4. Runs database-only business effects and optional outbox inserts, then writes append-only audit evidence and the durable command result in the same transaction.
5. Retries PostgreSQL serialization/deadlock failures at most three times. Contention/timeouts return a retry-required conflict; clients retain the same key for an unresolved attempt.

A deferred constraint prevents a PROCESSING claim from committing without its result. Completed command identities/results cannot be edited or deleted. These records have no automatic TTL: durable offline duplicate protection must outlive device replay windows. Domain source-event uniqueness will supplement command keys in finance migrations.

Handlers may be retried after a rollback. Never perform object writes, provider calls, notifications or receipt generation inside them. Outbox records contain only scoped references and an explicitly chosen document locale (`en`, `bn`, `en-bn`), not raw financial documents or credentials. A later worker will reauthorize relevant access and deliver after commit; Phase 3 does not dispatch events.

Audit records contain tenant/branch, actor, action, entity reference, request ID and allowlisted evidence. PostgreSQL prevents update/delete; runtime privileges are append-only. Ordinary runtime access cannot rewrite audit, permission definitions, platform grants or migration history. No public audit browsing API exists.

## Baki ledger requirements carried forward

The expanded root specification is authoritative. Customer receivable and supplier payable use one future subledger engine with separate account kinds/currencies, immutable signed entries, open items, payment/non-cash settlements, reversals and rebuildable projections. Post the full sale/purchase and each payment separately; allocations never reduce debt twice. Preserve posting and effective timestamps, authorize branch-limited statements, and keep advances/credits visible. See [credit ledger design](credit-ledger-design.md).

The seed now contains 38 permission definitions, including customer/supplier ledger/payment access, finance reports, adjustments, reversals and payment methods. This defines capabilities without implementing the business endpoints or granting them to existing memberships.

## Verification

`yarn run check` covers schema validation/generation, lint, source/tool typechecks, isolated request/policy tests and build. `yarn test:integration` applies both migrations to a newly generated disposable PostgreSQL database, seeds twice, and tests ownership, permission revocation, concurrent commands, rollback, audit/outbox restrictions, R2 finalized metadata and real HTTP readiness. No test data is written to the application's local database.
