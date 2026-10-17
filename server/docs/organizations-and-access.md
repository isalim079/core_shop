# Organizations, staff and branches

Phase 5 provides tenant onboarding, current membership/permission context, branches, role presets/custom roles, invitations, membership lifecycle, ownership transfer and verified-file branding references. All routes use `/api/v1`. Development Swagger is `/api-docs`.

## Create and select a business

An authenticated user with a verified email or phone calls `POST /organizations` with a UUID `Idempotency-Key` and:

```json
{
  "name": "রহিমের দোকান",
  "currency": "BDT",
  "timezone": "Asia/Dhaka",
  "documentLanguage": "en-bn"
}
```

Optional fields are `currencyScale` (0–4, defaults to the currency's standard fraction digits), `quantityScale` (0–6, default 3), and `address`. Currency must be a supported ISO currency; timezone must exist in PostgreSQL's zone catalog. The service atomically creates an ACTIVE organization, an ACTIVE owner membership with ALL-branch access, the MAIN branch and five permission-backed presets. Negative stock starts disabled. No staff, sample products or platform grants are seeded.

The response contains `organizationId`, `membershipId`, and `branchId`. Reusing the same key and normalized creation data returns those original IDs. Changed data with the same key returns `IDEMPOTENCY_PAYLOAD_MISMATCH`. A user-row lock prevents concurrent retries from creating duplicate businesses. Creation keys belong to the authenticated user; a replay after their membership is revoked is denied.

`GET /organizations` lists only the signed-in user's active memberships in active organizations. A person may belong to multiple businesses with different roles and branches. No global active-tenant variable or client claim grants access.

For every tenant route `/organizations/:id/...`, send matching `X-Organization-Id`; optional `X-Branch-Id` narrows branch selection. The server resolves current user, organization, membership, roles and branch grants on each request. A path/header mismatch returns 404; non-membership/unauthorized selected branches return 403. `GET /organizations/:id/context` returns current effective permission codes, owner flag, roles, branch access and selected branch. The client may cache this for UI visibility but must handle later 403 responses when access changes.

Lists use `limit` (1–100), optional opaque cursor and `direction=asc|desc`, with `{ items, nextCursor }`. Cursor navigation never removes organization or branch filters.

## Permission and role policy

Owners have all recognized organization permissions and ALL-branch access; ownership is a separate membership flag, not a role code. The owner flag never grants another organization's access or platform support powers. Non-owners receive the union of their unarchived roles' permission codes.

| Initial role | Intended scope |
| --- | --- |
| ADMIN | Operational permissions; excludes billing management |
| MANAGER | Sales, stock, purchases, limited staff operations and operational/credit reports |
| CASHIER | Sales, necessary customer/receivable/payment actions and file references |
| INVENTORY_MANAGER | Products, stock adjustments, purchasing and supplier basics |
| ACCOUNTANT | Expenses, collections/payments, ledgers and financial reports/exports |

The exact catalog and initial bundles live in `src/organizations/permissions.ts`, shared by provisioning and the reference seed. Role names do not authorize anything. Finance/catalog permissions become usable only when their domain modules are implemented.

`GET /:id/roles` requires ORG_VIEW. `GET /:id/permissions` requires STAFF_MANAGE. Creating/updating/archiving role definitions requires both STAFF_MANAGE and actual ownership. Permission codes must already exist in the catalog; platform capabilities cannot be injected. Role codes and tenant references are immutable. Archival is blocked while a role is assigned to an active member or a live pending invitation; archived roles are excluded from authorization. Editing a role updates current effective permissions on the next request.

STAFF_MANAGE permits staff administration subject to delegation limits. A non-owner cannot manage themselves, an owner, a privileged peer, or a staff member with permissions/branches outside their own authority. They cannot delegate STAFF_MANAGE, ORG_UPDATE, BRANCH_MANAGE or BILLING_MANAGE. They can invite/update ordinary staff using role permissions they already hold, with branch grants no wider than their own. Only an owner can grant those administrative capabilities or change role definitions. Ownership is never accepted as an editable membership field.

## Invitations and membership lifecycle

1. A permitted staff manager calls `POST /organizations/:id/invitations` with `channel` (EMAIL/PHONE), `contact`, `roleIds` (at most 10), `branchAccess` (ALL/SELECTED), and `branchIds` (at most 100). ALL requires an empty branchIds array. Every role/branch must be active and belong to the selected organization.
2. An offer expires after seven days. Only one PENDING offer exists for a contact/channel in an organization; requesting a replacement first revokes an expired offer. No account lookup or creation is required: a recipient may register later.
3. A recipient signs in with their verified email or phone and calls `GET /organizations/invitations/incoming`. Only offers matching their current verified contacts are shown. An offer UUID is a selector, never a bearer invitation credential.
4. `POST /organizations/invitations/:invitationId/accept` checks the verified contact, active organization, expiry and current inviter permissions, roles and branch availability. It atomically creates membership/grants, marks acceptance, and audits the join. Acceptance is replay-safe for the same active member. It never overwrites an existing membership or reactivates a suspended/revoked one.
5. `POST /organizations/:id/invitations/:invitationId/revoke` revokes a pending offer. Owners may revoke any offer; other managers may revoke only their own. Offers cannot be retargeted or resurrected after acceptance/revocation.

Invitation creation also records an outbox event with only the offer ID. **No automatic invitation email/SMS is sent yet.** The in-app incoming-offers API works independently of delivery settings. A notification worker and outbound invitation templates remain in the background-services phase; Phase 4 SMTP verification and its provider setup are unchanged. No plaintext invitation secrets exist in records, cached commands or diagnostics.

`GET /organizations/:id/memberships` requires STAFF_MANAGE and returns safe staff/profile/grant metadata. Owners see all memberships; other managers see themselves and members within their delegation authority. Owner invitation lists cover the tenant; other managers see only offers they created. `PATCH /organizations/:id/memberships/:membershipId` replaces roleIds and branchAccess/branchIds explicitly and sets status ACTIVE/SUSPENDED/REVOKED. It cannot change the user, tenant or owner flag. Referenced memberships are retained for audit/financial history. Access is rechecked from current state; session token rotation is unnecessary when a membership is revoked. An owner can explicitly reinstate a non-owner member with valid assignments, but invitations cannot bypass a prior suspension.

## Branches and settings

| Operation | Required permission / rule |
| --- | --- |
| GET `/:id`, `/:id/branches` | ORG_VIEW; branches restricted to granted/selected scope |
| PATCH `/:id` | ORG_UPDATE; name, address and default document language only |
| POST `/:id/branches` | BRANCH_MANAGE and ALL-branch access |
| PATCH `/:id/branches/:branchId` | BRANCH_MANAGE and access to that active branch |
| POST `/:id/branches/:branchId/archive` | Same, while retaining an active branch |
| PATCH `/:id/branding` | ORG_UPDATE; scoped READY logo/cover files only |

Codes are stable tenant-unique uppercase identifiers. Branches archive rather than being hard-deleted, preserving references and code history. Concurrent archives serialize on the organization row; the API and a deferred database constraint prevent archiving the final active branch. Archived branch IDs no longer authorize branch operations. SELECTED with no active grants means no branch data access.

Currency, currency precision, quantity precision and business timezone are fixed at onboarding, with a database trigger preventing casual edits. Changes need a separate migration workflow so future ledger/stock history cannot be silently reinterpreted. Negative-stock changes, tax/rounding settings, commerce records and subscription limits remain in their assigned phases. Document language is en/bn/en-bn and does not change the user's English/Bangla UI preference.

Branding accepts `logoFileId` and/or `coverFileId`, with null clearing a reference. Files must be READY, undeleted, correctly purposed and owned by the same organization; both service checks and existing database binding constraints apply. Responses contain file IDs, never public object URLs. Uploading R2 bytes, scanning, signed URLs and image-serving APIs remain in the private-files phase. The owner/avatar personal-file scope stays separate.

## Ownership and transaction guarantees

`POST /organizations/:id/ownership/transfer` requires the current owner and a session created within ten minutes. Supply an ACTIVE target `membershipId` in this organization and explicit `previousOwnerRoleIds` (possibly empty). Target ownership becomes ALL-branch; the former owner stays a member with only the requested delegated roles. No admin role is assigned implicitly. Promotion/demotion/grant changes and audit evidence commit atomically; the existing deferred owner constraint always retains an ACTIVE owner membership. Normal staff edits cannot suspend/revoke an owner.

Every tenant mutation requires a UUID `Idempotency-Key`. A command's namespace includes its operation/target, tenant and actor. Same payload/key replays the original result; mismatch returns 409. Revoked permissions are rechecked before serving cached results. Onboarding uses its own user-scoped creation record before a tenant membership exists; invitation acceptance uses its terminal acceptance record.

Control-plane writes lock the organization before user/membership/role/grant rows and use the existing serializable command/retry engine. Normal commands/read revalidation acquire the organization share lock first. This makes permission changes and business commands observe a consistent authorization boundary and avoids membership-to-organization lock inversion. User-session revocation is rechecked inside sensitive write transactions; transfer also checks recent authentication.

Authentication/database pool sessions are pinned to UTC regardless of PostgreSQL/OS defaults. Business timezone is separate display/date-domain configuration. A regression test compares ORM timestamps to actual database epoch time and tests SQL expiry behavior. All future connection factories must preserve that session setting; readiness rejects a non-UTC adapter session.

Audit records contain static actions, actor/tenant/entity/request/command IDs and controlled metadata, without contact values, user-entered names, passwords or tokens. Failed commands roll back their business effects/audit/outbox/command claim together. Root/tenant tables remain accessible to the restricted runtime through scoped application repositories; PostgreSQL RLS is still a deferred defense-in-depth layer and no automatic row-filtering claim is made.

Run `yarn run check` and `yarn test:integration`. The integration runner creates a disposable database and tests real authenticated HTTP flows, multiple tenants, delegation, stale/revoked access, verified-recipient offers, role updates, branding, ownership, replay, concurrent onboarding and concurrent archival. No provider messages are sent and no business example data is inserted into the application database.

References: [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html), and the [Prisma adapter timezone issue](https://github.com/prisma/prisma/issues/26786).
