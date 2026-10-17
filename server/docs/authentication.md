# Authentication and account lifecycle

Phase 4 supports passwords after initial email/phone verification, Google sign-in, contact/provider linking, password recovery, profile language and session management. All paths below are under `/api/v1/auth`. Development Swagger remains at `/api-docs`.

## Configuration and delivery

Set `AUTH_SECRET` to a cryptographically random secret of at least 43 characters; generate 32 random bytes encoded as base64url. Local development has its own generated value in ignored `.env.local`. Share the same secret across API instances and store it in the deployment secret manager. It keys OTP hashes and pseudonymous rate-limit identifiers. Changing it invalidates outstanding codes and rate buckets; session-token hashes are independent. Empty configuration fails credential endpoints closed with 503, while liveness/readiness remain database checks.

Email uses SMTP: `SMTP_HOST`, `SMTP_PORT` (587 default), `SMTP_SECURE` (`true` for implicit TLS, usually port 465), `SMTP_FROM`, and optional paired `SMTP_USER`/`SMTP_PASSWORD`. Connections require TLS and certificate verification. Authentication email is plain text, with no third-party templates, tracking, provider logging or credential output. Delivery is awaited with bounded network timeouts. Provider failures return a generic 503 and consume the challenge; the user must request another code. Ambiguous SMTP acceptance can result in an unusable delivered code, never an authentication bypass. A retry can issue another independent code. Delivery happens after committing the challenge, so provider failures cannot hold a database lock.

The SMS vendor is awaiting the project owner's selection. `SmsDelivery` is the provider interface; the default implementation is unavailable. Phone registration, recovery and linking fail closed until its adapter is implemented/configured. No SMS account has been created and no real messages were sent in development tests.

Configure `GOOGLE_CLIENT_IDS` with the exact allowed OAuth client IDs for the supported clients. Google integration is unavailable until configured. Do not put Google client secrets in the app: ID-token verification needs allowed client IDs and Google's public signing keys. Real SMTP delivery and Google SDK sign-in need a final provider smoke test with the owner's settings.

## Email/phone registration and recovery

1. `POST /registration/request` with `{ "channel": "EMAIL", "contact": "owner@example.com" }`, or `PHONE` with an E.164 number such as `+8801712345678`.
2. The response is `{ "accepted": true, "challengeId": "uuid", "expiresIn": 600 }`. The six-digit code is delivered to the contact, never returned or logged. Existing and unknown contacts follow the same response/delivery path. These flows send a code even if registration/reset is inapplicable, to avoid revealing account existence through provider errors or timing. Anti-abuse limits apply to all requests.
3. `POST /registration/complete` with `challengeId`, `code`, `password`, `displayName`, and optional `preferredLanguage` (`en`/`bn`). Only a proven contact can create an active user. The password is selected after verification, so an attacker cannot pre-register a victim's email with an attacker-chosen password. Then sign in using the appropriate transport below.
4. Existing users recover through `POST /password/reset/request` with the same contact shape, then `/password/reset/complete` with `challengeId`, `code`, and the replacement `password`. Successful reset revokes every session and consumes remaining account-bound challenges in the same transaction. Unknown/unverified/suspended accounts cannot reset. Completion failures share a generic 401.

Codes expire after ten minutes, allow at most five attempts, bind to their purpose/contact, and are consumed once. Each challenge is protected by a row lock. Passwords allow Unicode, spaces and 15–128 characters (at most 512 UTF-8 bytes), and use Argon2id with 64 MiB memory, three passes and one lane. At most four hashes/verifications run concurrently per API process; overload returns 429. Unknown-account password checks use a dummy hash.

Email addresses are trimmed and lowercased, with no provider-specific dot/plus rewriting. Phone numbers must already be explicit E.164; the server never guesses a country. Existing suspended/deleted/pending users cannot sign in. A contact is usable for password login only when its matching verification timestamp exists.

## Session transports

| Concern | Mobile | Web |
| --- | --- | --- |
| Login | `POST /mobile/login` | `POST /web/login` |
| Login body | `channel`, `contact`, `password`, `deviceName` | Same |
| Access | JSON `accessToken`; send `Authorization: Bearer ...` | HttpOnly host cookie |
| Refresh | JSON `refreshToken` in OS secure storage | HttpOnly cookie limited to `/api/v1/auth/web` |
| Refresh call | `/mobile/refresh` with `refreshToken` | `/web/refresh` with `{}` and cookies |
| CSRF | No browser Origin accepted for credential issuance | Exact allowed `Origin` plus `X-CSRF-Token` for refresh and authenticated writes |

Access credentials expire after 15 minutes, with a fixed 30-day maximum session lifetime. Every request checks current session revocation, expiry and user status in PostgreSQL. Access and refresh values are independent random 256-bit opaque secrets; only SHA-256 hashes are stored. No JWT bearer claims are trusted. Refresh replaces both credentials and the CSRF secret atomically. The client must serialize refresh attempts: a used refresh token revokes its entire session family, including credentials issued by another concurrent refresh. Revocation commits before the 401 response. Used-token history is retained until the family expires.

Browser login returns session metadata and a CSRF token, never access/refresh values. Keep the CSRF token in tab memory and include it in subsequent cookie-authenticated writes/refresh. On a page reload, request a fresh value through the origin-protected `/web/csrf` endpoint. Web clients must use `credentials: 'include'`. Cookie writes check both the configured exact origin and the session's CSRF hash. SameSite=Lax cookies require frontend/API deployment on the same site; use a same-site API/reverse proxy. Production cookies are Secure, HttpOnly, and use `__Host-`/`__Secure-` prefixes without Domain attributes. Development uses unprefixed cookies over local HTTP. Requests mixing bearer and access-cookie credentials are rejected. Native mobile clients omit Origin; browser clients use the web transport.

A maximum of 20 active sessions per account is enforced under the user lock, revoking older sessions. `GET /sessions` lists safe metadata; `DELETE /sessions/:id`, `POST /logout`, and `POST /logout-all` revoke sessions owned by the current user. Logging out another user's session never affects it. Session tokens and CSRF values never appear in session lists or audit metadata.

## Google and account linking

1. `POST /google/challenge` returns a five-minute `challengeId` and random `nonce`.
2. Pass that nonce to Google's sign-in SDK. Send its ID token, `challengeId`, and `deviceName` to `/mobile/google` or `/web/google`.
3. The official Google library checks the token signature, allowed audience, issuer and expiry. The service additionally requires a verified email and a matching single-use nonce. Identity is keyed by Google's immutable `sub`, never by a client-provided email or display name.
4. First-time Google registration requires an address for which Google is authoritative (Gmail or Workspace). Other Google addresses can first register/verify through this server and explicitly link Google afterward. An existing account with the same email is **never merged automatically**. Sign into that account first, obtain a nonce, then call `/mobile/google/link` or `/web/google/link` with the current authentication credential and the Google proof.

Linking requires a session established within the last ten minutes, checked again inside the user-locked transaction. Each user can have one Google identity. One Google subject cannot belong to multiple users. An existing linked identity continues to identify the same user if Google's email changes. Google profile/avatar URLs are never downloaded or adopted as trusted private files.

To add a missing email or phone method, use authenticated `POST /contacts/request` with the contact, then `/contacts/complete` with its `challengeId` and `code`. Both calls require recent authentication, and completion rechecks the session under the user lock. Verified contact replacement/unlinking is deliberately a later account-management workflow. A Google-created user can set their initial password through verified email recovery. `GET/PATCH /me` exposes/edits safe profile fields and English/Bangla preference.

## Abuse controls, evidence and operations

PostgreSQL rate buckets apply across API instances: 30 requests per IP/operation and eight per contact/challenge/operation in a 15-minute fixed window. Counters commit outside failed authentication transactions. Bucket identifiers are keyed hashes, never raw IPs/contacts. General request limiting remains per process. Trusted-proxy configuration determines the actual client IP. OTP attempt limits remain authoritative even when the caller changes IP addresses.

Global authentication audit events are append-only and contain a static action, server request ID, optional actor/session IDs and empty metadata. Passwords, destination contacts, raw provider errors, codes, tokens and headers are excluded from diagnostics/audit. Authentication tables have restricted runtime grants, hash-format checks, and irreversible consumption/revocation constraints. Tenant authorization still uses current memberships/permissions; login does not grant organization access.

Run `yarn run check` and `yarn test:integration`. Integration tests create a disposable migrated database and replace only delivery/Google verification boundaries with controlled test providers. Tests exercise actual HTTP guards, database locking, password hashing, token rotation, CSRF, replay and account-collision behavior. Invalid Google credentials are also rejected through the real verification adapter. No production test hook exists.

Run the reviewed `scripts/database/cleanup-auth.sql` periodically as a maintenance owner/job, never the runtime login. It removes only expired challenges/buckets and fully expired session families (refresh history first). No active family history is removed, preserving replay detection. Audit records remain append-only. Provisioning that scheduled maintenance job and live provider credentials is an operational deployment step.

Security references: [Google server-side ID-token validation](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), and [RFC 9700 refresh-token replay guidance](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14).
