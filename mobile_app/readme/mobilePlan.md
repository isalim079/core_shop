# Core Shop mobile — implementation plan

Created: 2026-10-16. Scope: Android and iOS phones. Status: proposed roadmap grounded in the current repository; planned routes and capabilities below are not implemented claims.

Companion: [live progress tracker](mobileProgress.md). Sources: [product specification](../../readme/project_structure.md), [server tracker](../../server/readme/serverProgress.md), [server guide](../../server/README.md), and `src/`.

`readme/` is ignored by Git. These documents are local working files and will not appear in a fresh clone. Keep a separate backup; change the ignore policy only when requested.

## Priority addition — static UI/UX before integration

Owner direction added 2026-10-16: execute **M01-UI01 through M01-UI16** first, as detailed in [the UI/UX static plan](mobileUiUxPlan.md) and [the progress tracker](mobileProgress.md). Build the static auth, onboarding, dashboard, tab-wise features, settings, sliders, animation and smoothness before dynamic/server integration. Centralize fixtures in `src/staticData/`; use reusable components, feature patterns and hooks following DRY.

The original milestones, environment-first suggestion and integration phases below are retained as the earlier baseline, not the current execution order. The UI/UX addition takes precedence where sequencing or fixture scope differs. It requires skill-awareness, deterministic local interactions, mobile accessibility and recorded device performance evidence. Completing static UI does not complete the later production/security/API gates.

## 1. Purpose and working rules

Deliver a reliable retail operations app: a staff member selects an authorized business and branch, finds products, records purchases and sales, tracks inventory and balances, and sees only the reports and settings they may access.

1. Read `AGENTS.md`, this plan, and the tracker before work. Reinspect changed files and server contracts; other work may be happening concurrently.
2. Work in one bounded phase or vertical slice. Record task IDs, files, contract dependencies, checks, and remaining gaps in the tracker.
3. Separate UI implemented, API integrated, device verified, and owner accepted. A screen with fixtures is not a completed business feature.
4. Follow the user's current authorization. A checkpoint records a review boundary; this document does not create an additional permission requirement or authorize unrelated server changes.
5. Before changing Expo/React Native behavior, reread the installed Expo major and matching docs. Baseline is Expo 57, React Native 0.86, React 19.2, Expo Router, TypeScript, Redux Toolkit/RTK Query, NativeWind, and Yarn Classic.
6. Use Expo Router for all app navigation. Keep business logic, hooks, components, and storage outside `src/app/`. Use Expo-compatible installation commands for dependencies.
7. Keep Android/iOS as the supported targets. Configure native behavior through app config and plugins; do not hand-edit generated native projects.
8. Never present demo authentication, hardcoded metrics, client permissions, or unsynchronized financial drafts as verified server behavior.
9. Add folders and dependencies when a real slice needs them. Do not generate an empty architecture or every proposed screen in advance.

## 2. Inspected baseline and immediate gaps

| Area | Observed implementation | Work required |
| --- | --- | --- |
| Entry | Root providers, Poppins fonts, native/custom splash, session hydration | Error recovery, reduced motion, cold-start/device timing evidence |
| Authentication | Login/register forms; login creates `demo-token`, registration waits then returns | Real contract integration, verification, recovery, session expiry |
| Session | AsyncStorage persistence; storage writes inside reducers | Secure secret storage, pure reducers, awaited persistence and migration |
| Refresh | RTK Query wrapper requests `/auth/refresh-token` | Resolve mismatch with specification example `/auth/refresh`; test rotation/concurrency |
| Navigation | Root stack, auth/private groups; Home and Profile tabs | Business context guards, proposed operational tabs, child stacks and deep links |
| Home | Zero-valued cards and decorative quick-action rows | Real scoped summaries, actionable links, honest empty/unavailable states |
| Profile | Name/email and local sign out | Account management, session controls and settings |
| API address | `http://localhost:3000/api/v1` constant | Public per-environment URL, physical-device reachability and production HTTPS |
| API contracts | Auth endpoint definitions and hand-written response types | Reconcile against implemented OpenAPI; do not assume example routes exist |
| Server | Tracker records foundation and future business phases | Recheck live server source/OpenAPI before integration; active changes may exceed tracker |
| UI | Screen, Button, TextField, theme and keyboard helpers | Consistent list/form/detail states, accessibility and safe-area coverage |
| Assets | CS PNG used for app icon and splash | Device build visual checks; repair stale icon generator referencing missing `logo.png` |
| Release | EAS development/preview/production profiles | Replace project/submission placeholders when authorized; release verification |
| Quality | Lint/typecheck commands exist; no test script in manifest | Meaningful automated coverage plus device workflow evidence |

## 3. Product scope and milestones

**Milestone A: trustworthy shell.** Navigation, session lifecycle, organization/branch context, UI states, environment configuration, and settings skeleton. This can progress before business APIs using explicit development fixtures where useful.

**Milestone B: online retail MVP.** Catalog, contacts, inventory visibility, purchasing, sales/payment/returns, expenses and basic reports integrated with authorized server contracts.

**Milestone C: launchable mobile workflows.** Selected offline sales/cache synchronization, accessibility/performance verification, secure release configuration and both-platform release builds.

**Later capabilities:** camera barcode scanning, rich notifications, PDF/export jobs, branch transfers, advanced aging, billing provider integrations and industry packs. Promote an item into launch scope only with a recorded product decision. Basic entitlement enforcement remains part of the foundation even if billing purchase flows are deferred.

The broad product specification is a platform roadmap. Full web/admin parity is not required for the first mobile release. Platform operator administration and break-glass support do not belong in the merchant app.

## 4. Navigation architecture

### 4.1 Route ownership

Retain `src/app/` and existing auth/private groups. Add an onboarding group when organization setup is implemented. Private routes require a valid session; business routes additionally require an authorized organization, branch where applicable, and permission. Account/recovery access must remain available when the user has no business membership.

Proposed route layout:

```text
src/app/
  _layout.tsx                      # providers, startup, global route groups
  index.tsx                        # resolve session and business context
  +not-found.tsx
  (auth)/_layout.tsx
  (auth)/login.tsx
  (auth)/register.tsx
  (auth)/forgot-password.tsx
  (auth)/reset-password.tsx
  (auth)/verify-email.tsx
  (onboarding)/_layout.tsx
  (onboarding)/organizations.tsx
  (onboarding)/create-business.tsx
  (onboarding)/join-business.tsx
  (onboarding)/select-branch.tsx
  (private)/_layout.tsx             # account-safe private stack + business guards
  (private)/(tabs)/_layout.tsx
  (private)/(tabs)/index.tsx         # Home
  (private)/(tabs)/sell.tsx          # Sell
  (private)/(tabs)/inventory.tsx     # Inventory
  (private)/(tabs)/activity.tsx      # Activity
  (private)/(tabs)/more.tsx          # More
  (private)/products/...            # details and editor screens
  (private)/sales/...               # cart, checkout, receipts and returns
  (private)/purchases/...
  (private)/inventory/...           # ledger and stock operations
  (private)/customers/...
  (private)/suppliers/...
  (private)/expenses/...
  (private)/reports/...
  (private)/settings/...
  (private)/profile/...             # migrate current tab profile here
  (private)/notifications/...
  (private)/sync/...
```

The tree is a directory outline; the registry below defines concrete filenames. Do not create `inventory/index.tsx` alongside the `inventory` tab: groups are absent from public URLs, so that would duplicate `/inventory`. Likewise, Sales history uses `/sales` and the Sell tab uses `/sell`; Home is the sole final `/` screen. When moving root redirect behavior, resolve the current root `index.tsx` and tab `index.tsx` overlap deliberately and verify typed-route generation. Do not add a second grouped route with the same public path.

### 4.2 Proposed bottom tabs

| Tab | Purpose | Primary action | Access/fallback |
| --- | --- | --- | --- |
| Home | Branch context, daily summary, stock alerts and shortcuts | New sale / operational shortcut | Hide restricted amounts; show permitted next actions |
| Sell | Fast product search, variant selection and active cart summary | Open cart / checkout | `SALE_CREATE`; hide when not allowed, direct access still guarded |
| Inventory | Branch stock list, low stock and product search | Product detail / permitted add action | Inventory/catalog read permissions; hide unavailable actions |
| Activity | Recent sales, purchases, payments and expenses | Open filtered record detail | Show only permitted record categories |
| More | Contacts, purchases, expenses, reports, settings and profile | Open a module | Always available to signed-in users, including no-business recovery |

Five tabs are a proposed default, not an existing implementation. Filter unavailable tabs consistently after permissions load; never briefly expose restricted content. If a user's selected tab becomes unavailable, choose the first permitted tab, with More as the safe fallback. Preserve list position and tab state within the active business; reset sensitive state on logout or context switch. Use the existing JavaScript tabs first unless a documented device requirement justifies another navigator.

### 4.3 Navigation behavior contract

- Startup state: initializing → unauthenticated / session validation → no organization / no branch / authorized app. Distinguish network failure from invalid credentials; a connectivity error must not fabricate an authenticated online session.
- Cold and warm protected deep links retain a validated internal destination through authentication and business selection. Recheck entity tenant and permission; reject arbitrary return URLs and sensitive query parameters.
- `coreshop://` is the current custom scheme. Password-reset/invite tokens must be short-lived and redacted; universal/app links need verified domain association and a later recorded setup decision.
- Replace history after login/logout/context resolution so Back cannot restore an invalid session. Logged-in users opening login get the appropriate private destination.
- Android hardware/predictive Back and iOS interactive swipe obey the same unsaved-change policy. Confirm draft discard only when data would be lost; avoid nested confirmations.
- Lists retain filters and scroll on detail return. Form success returns to the affected record/list and refreshes relevant data; failed saves retain input.
- Record detail pages live outside the tab group for focused full-screen work. Pickers/filters may use modals; checkout and financial confirmation need deliberate review screens.
- Every pushed screen gets an accessible back affordance and title; a direct link without back history gets a safe module fallback.
- Large text, keyboard, gesture areas and bottom insets must not cover tab labels or submit controls. Avoid a fixed tab height that ignores device insets.
- Not-found, forbidden, revoked membership and deleted records have separate recoverable states. A hidden link never substitutes for a route/API authorization check.

## 5. Full proposed screen registry

All rows below are planned unless explicitly identified in the tracker baseline. Paths are mobile routes, not API contracts. Each feature must implement loading, empty, error/retry, offline/stale, forbidden and submitting states where relevant.

### 5.1 Entry, authentication and business selection

| File under `src/app/` | Screen and behavior | Access/dependency |
| --- | --- | --- |
| `index.tsx` | Entry resolver; no duplicate flash or redirect loop | Hydration and session resolution |
| `+not-found.tsx` | Explain missing route; safe home/sign-in destination | Public |
| `(auth)/login.tsx` | Email/password, visibility toggle, inline/server errors, recovery link | Real login contract |
| `(auth)/register.tsx` | Name/email/password, field errors, policy links | Register contract and verification policy |
| `(auth)/forgot-password.tsx` | Request recovery with non-enumerating confirmation | Recovery API |
| `(auth)/reset-password.tsx` | Validate link/token, choose password, expired-link recovery | Recovery API |
| `(auth)/verify-email.tsx` | Pending/verified/expired, resend cooldown | Verification API |
| `(onboarding)/organizations.tsx` | Select authorized membership, empty/revoked/invited states | Membership API |
| `(onboarding)/create-business.tsx` | Business identity, timezone/currency, initial branch | Organization create entitlement |
| `(onboarding)/join-business.tsx` | Validate and accept invitation; show intended organization | Invitation API |
| `(onboarding)/select-branch.tsx` | Select permitted branch; no-access support path | Branch membership API |

### 5.2 Core operational workflows

| File under `(private)/` | Screen and behavior | Access/dependency |
| --- | --- | --- |
| `(tabs)/index.tsx` | Real daily summary, branch selector, low-stock and shortcuts | Scoped summary contracts |
| `(tabs)/sell.tsx` | Product search, variants, quantity, cart badge; scanner later | Sales create + product read |
| `(tabs)/inventory.tsx` | Virtualized stock list, search, category and low-stock filters | Inventory read |
| `(tabs)/activity.tsx` | Paginated typed transaction feed, dates/status filters | Authorized activity sources |
| `(tabs)/more.tsx` | Module directory, account and context controls | Permission/entitlement map |
| `products/[productId].tsx` | Product/variant detail, price, branch stock, allowed actions | Product read |
| `products/new.tsx` | SKU/name/unit/category/price, server field errors | Product create |
| `products/[productId]/edit.tsx` | Edit metadata with conflict/version handling; archive action | Product update/archive |
| `sales/index.tsx` | Sale history, search, dates, payment/status filters | Sales read |
| `sales/cart.tsx` | Variant lines, quantities, customer, discounts, draft persistence | Sales create |
| `sales/checkout.tsx` | Totals review, method, paid/due amount, confirm once | Payment/credit policy + idempotency |
| `sales/[saleId].tsx` | Committed receipt, line snapshots, payments, return/void eligibility | Sale read; action permissions |
| `sales/[saleId]/return.tsx` | Remaining returnable quantities, reason, refund review | Refund API/permission |
| `sales/[saleId]/payment.tsx` | Collect outstanding balance; duplicate prevention | Payment create |
| `purchases/index.tsx` | Supplier/date/status list | Purchase read |
| `purchases/new.tsx` | Supplier, variant quantities, costs, payment and receipt review | Purchase create |
| `purchases/[purchaseId].tsx` | Received quantities, costs, payments and return eligibility | Purchase read |
| `purchases/[purchaseId]/return.tsx` | Return remaining eligible items with reason | Purchase return |
| `purchases/[purchaseId]/payment.tsx` | Pay outstanding supplier balance | Payment create |
| `inventory/ledger.tsx` | Filtered immutable movements with source record links | Inventory read |
| `inventory/adjust.tsx` | Count/correction, reason and confirmation; no raw balance edit | Inventory adjust |
| `inventory/transfers/index.tsx` | Branch transfer list; later scope | Multi-branch capability |
| `inventory/transfers/new.tsx` | Source/destination and quantities; later scope | Transfer permission/API |
| `inventory/transfers/[transferId].tsx` | State and permitted receive/cancel actions; later scope | Transfer state machine |

A dedicated activity endpoint is not assumed. If composing authorized feeds initially, define bounded pagination and ordering with the server; do not merge arbitrarily truncated pages and claim a complete timeline.

### 5.3 Relationships, expenses and reports

| File under `(private)/` | Screen and behavior | Access/dependency |
| --- | --- | --- |
| `customers/index.tsx`, `customers/new.tsx` | Search/paginate customers; validated create | Customer read/create |
| `customers/[customerId].tsx`, `customers/[customerId]/edit.tsx` | Contact, receivable summary, transactions and edit | Customer read/update; financial visibility |
| `suppliers/index.tsx`, `suppliers/new.tsx` | Search/paginate suppliers; validated create | Supplier read/create |
| `suppliers/[supplierId].tsx`, `suppliers/[supplierId]/edit.tsx` | Contact, payable summary, purchases and edit | Supplier read/update |
| `expenses/index.tsx`, `expenses/new.tsx` | Date/category list; amount/date/reason capture | Expense read/create |
| `expenses/[expenseId].tsx`, `expenses/[expenseId]/edit.tsx` | Detail, authorized correction with audit semantics | Expense read/update policy |
| `reports/index.tsx` | Available report types and scope | Report permissions/entitlements |
| `reports/sales.tsx` | Revenue/returns/payment summaries by date/branch | Sales report |
| `reports/profit.tsx` | Server-calculated cost/profit; no client-invented margins | Profit-specific permission |
| `reports/inventory.tsx` | Stock quantity, low stock and permitted valuation | Inventory report |
| `reports/expenses.tsx` | Category/time summaries | Expense report |
| `reports/balances.tsx` | Receivable/payable summaries; aging later | Finance permissions |

Reports need explicit business timezone, currency, filter bounds and freshness. Empty results are not evidence of zero profit. Exports are later asynchronous jobs with status/download handling rather than blocking report requests.

### 5.4 Account, settings and supporting routes

| File under `(private)/` | Screen and behavior | Scope |
| --- | --- | --- |
| `profile/index.tsx`, `profile/edit.tsx` | Current user and personal identity updates | User |
| `settings/index.tsx` | Account, business, operations and device sections | Filtered directory |
| `settings/security.tsx` | Change password, reauthentication, sign out everywhere where supported | User/session |
| `settings/sessions.tsx` | Device/session list and revoke another session | User/session API |
| `settings/business.tsx` | Business identity, address, timezone/currency with change warnings | Organization owner/admin permission |
| `settings/branches/index.tsx`, `settings/branches/new.tsx`, `settings/branches/[branchId].tsx` | Branch list/create/edit/archive rules | Branch management |
| `settings/team/index.tsx`, `settings/team/invite.tsx`, `settings/team/[membershipId].tsx` | Memberships, invites, role presets and permission summaries | Staff management |
| `settings/catalog.tsx` | Category/brand/unit sections and capability switches | Catalog management |
| `settings/catalog/categories.tsx`, `settings/catalog/brands.tsx`, `settings/catalog/units.tsx` | Reference lists and inline/modal create/edit/archive | Reference-data contracts |
| `settings/sales.tsx` | Receipt defaults, permitted discount/tax/credit/stock policies | Server business rules |
| `settings/notifications.tsx` | Preference categories and permission state; later delivery | User/device |
| `settings/preferences.tsx` | Supported language, formatting and motion preferences | Device/user policy |
| `settings/subscription.tsx` | Plan, usage, limits and renewal state; billing action only when approved | Billing/entitlements |
| `settings/data.tsx` | Cache usage, safe cache clear, export/deletion request guidance | Device + authorized requests |
| `settings/help.tsx`, `settings/about.tsx` | Help/contact, version/build, privacy and terms | Signed-in account access |
| `notifications/index.tsx`, `notifications/[notificationId].tsx` | Read/unread list and authorized destination; later scope | Notification API |
| `sync/index.tsx`, `sync/[commandId].tsx` | Queue, retry state and actionable conflict detail | Current user/business queue |

## 6. Settings rules and permission model

Settings must show actual persisted state. Device-only preferences must be labeled separately from organization policies. A setting is not enabled until its save succeeds; retain input on validation failures and handle concurrent edits. For optimistic updates, define rollback and show failure explicitly.

| Category | Required behavior and limits |
| --- | --- |
| Account | Update only permitted fields; email/password changes follow verification/reauthentication contracts |
| Business context | Switch among authorized memberships/branches; show active context prominently on operational screens |
| Business identity | Enforce immutable or migration-sensitive currency/timezone rules from server; warn about historical reporting implications |
| Team | Permission presets are readable; users cannot grant powers they do not have; protect final owner rules on server |
| Catalog | Prevent deleting reference data needed by historical documents; archive where appropriate |
| Sales policies | Never invent tax rates, negative-stock policy, credit limits or return rules; use server configuration |
| Appearance | Existing app forces light mode. Keep light-only initially; do not display a dark-mode switch until all surfaces support it |
| Language and currency | Default to supported business configuration. Externalize strings; do not assume Bangladesh timezone or USD from developer environment/demo UI |
| Notifications | Request OS permission only when the feature explains its use; handle denial and provide an OS-settings route |
| Local data | Clear read caches independently from queued writes; prevent accidental loss of pending financial commands |
| Subscription | Gating uses entitlements, not hardcoded plan names; server enforces limits; no fake upgrade/payment button |
| Privacy/deletion | Explain requests and financial retention; no immediate destructive business deletion without server-supported lifecycle |

Create a central permission/entitlement-to-action map. Permission names in the product specification are a design baseline; reconcile exact identifiers with server contracts before coding. Owner/admin/manager/cashier/inventory/finance are role presets, not substitutes for granular permissions. Test denied direct links and changed permissions during an active session.

## 7. Code organization and state boundaries

Extend existing folders rather than introducing a competing framework:

```text
src/
  app/                         # route composition, route params, navigator configuration
  components/
    ui/                        # buttons, fields, headers, status, dialogs and list states
    layout/                    # Screen, splash and shared layout
    catalog/ sales/ ...        # reusable domain UI when needed
  constants/                   # tokens, navigation defaults and stable configuration names
  hooks/                       # cross-feature behavior; domain hooks near their feature if clearer
  store/
    store.ts hooks.ts
    features/
      API/                     # shared transport, errors, auth refresh and cache conventions
      auth/                    # auth API and pure session state
      organization/            # active membership/branch and permissions
      catalog/ inventory/      # domain API endpoints and adapters
      sales/                   # sale drafts and commands
      purchases/ customers/ suppliers/ expenses/ reports/
      settings/ sync/          # add only with actual implementation
  services/
    session/                   # secure persistence/migration, session lifecycle
    storage/                   # later SQLite schema, migrations, repositories
    sync/                      # later queue runner, retry and reconciliation
  types/                       # client-only models and generated/validated contract adapters
  utils/                       # pure money/date/validation helpers as needed
```

RTK Query owns server data and invalidation. Redux owns session state, active context and in-memory draft/UI coordination. Local screen state owns field edits and transient modal state. Durable draft/queue data belongs in transactional local storage when offline work is implemented. Do not persist the entire query cache or duplicate every response into Redux slices.

Every query key and cache identity must account for organization, branch and relevant filters. On context switch: resolve dirty drafts first, abort old requests, clear/reset tenant-scoped queries and selections, then load the new context. Late responses from the old context must not render into the new one. Logout clears caches and secrets, with an explicit pending-command policy.

## 8. API integration and financial integrity

- Treat OpenAPI from the implemented server as authoritative. The product document's API table is illustrative. Track disagreements before choosing endpoint names, response envelopes, refresh semantics or pagination.
- Move API base URL into non-secret public environment configuration. Document LAN/emulator/simulator development addresses; production uses HTTPS. Never place server secrets in `EXPO_PUBLIC_*` values.
- Establish request cancellation, bounded timeouts, typed field/domain errors, request ID diagnostics, and explicit 401/403/404/409/422/429/network handling.
- Refresh must be single-flight, settle all waiting requests, rotate/revoke credentials correctly and avoid retry loops. Distinguish an expired session from a temporary server outage.
- Store session secrets in an SDK-compatible secure storage module. Remove credentials from AsyncStorage after a verified migration. Move persistence out of reducers into awaited services/middleware.
- Reset RTK Query data after logout and membership/context changes. Re-enable serializable checks or document narrowly justified exclusions.
- Agree money serialization, rounding, tax, discounts, returns, partial payments and currency precision. Use exact-decimal/minor-unit semantics matching the server; do not compute business truth with binary floating-point.
- Show estimated cart totals before commit; show authoritative server totals after commit. Historical receipt prices/costs remain snapshots, unaffected by later catalog edits.
- Sale/payment/purchase/return submissions carry durable idempotency keys where the server requires them. A timeout is an unknown result: reconcile by command/key before submitting a new financial operation.
- Handle stock/price/version conflicts with a reviewable difference and retained draft, not silent overwrite. Business invariants stay on the server.
- Paginate large lists; debounced searches cancel stale requests. Do not assume the existing nested page-number envelope will be the final API format.

## 9. Offline and synchronization scope

Offline capability is planned, not present. Add SQLite and connectivity support only after matching SDK docs and confirmed server sync contracts. Native dependencies require a development build.

| Workflow | Initial offline policy |
| --- | --- |
| Product/stock browsing | Last successful scoped cache, visible timestamp and stale indicator |
| Sale draft | Save locally, restore after process restart, scope to user/business/branch |
| Sale submission | Queue only under an approved offline-sale policy with server reconciliation; visibly pending |
| Inventory writes | Online initially; read cached stock. Offline adjustments require a separately approved command contract |
| Payments/refunds/voids | Online initially; no false confirmation when network state is unknown |
| Admin/team/billing settings | Online only |
| Reports | Cached snapshot may be shown with scope/time, never disguised as current |

Queue model: stable command ID, client ID, idempotency key, organization/branch/user scope, local timestamp, command type/version, entity version where applicable, payload, attempts, next retry, state and safe last error. States: draft → pending → sending → accepted / retryable / conflict / rejected. Persist acceptance and local reconciliation transactionally. A crashed sending command must be recoverable without a second sale.

Use bounded exponential backoff with jitter, foreground/reconnect triggers and manual retry. Do not promise continuous background execution on either OS. Surface failed commands and conflicts under Sync. Tenant switch, logout, account removal and cache clearing must preserve or explicitly resolve pending work; replay is allowed only under the correct authenticated context. No last-write-wins merge for financial commands.

## 10. UI, accessibility and performance contract

- Reuse colors/type/spacing and CS branding; consistent headers, primary actions, disabled/busy states and field errors. Avoid duplicate success messages or multiple simultaneous submitting controls.
- Every list: bounded/virtualized rendering, stable keys, refresh, pagination, no-results explanation, retry and retained filters. Every form: labels, keyboard type, focus order, submit handling and retained input on error.
- Screen-reader labels/roles/state, logical focus after navigation/dialogs, readable contrast, adequate hit areas, large-text layout and reduced motion. Validate with TalkBack and VoiceOver, not screenshots alone.
- Test short/tall phones, notches, Android gesture/three-button navigation, keyboard open, iOS swipe back and interrupted app lifecycle. Respect inset ownership to avoid doubled or missing padding.
- Minimize per-item renders, size product thumbnails, bound image caches, cancel stale work and avoid nested same-axis scrolling lists. Profile release builds with representative catalog sizes before choosing new list libraries.
- Establish measured startup/search/list-scroll and memory baselines on named lower/mid-range Android hardware and a supported iPhone. Record build type, data size and measurement method before setting a performance budget.
- Business dates use the selected business timezone; UI localizes display. No hardcoded dollar sign, ambiguous date or unlabelled unit.

## 11. Implementation phases and acceptance criteria

Each task ID is tracked in `mobileProgress.md`. Server phase references below refer to the server tracker, not an assumption that those phases have shipped.

| Phase | Tasks and deliverables | Dependency | Acceptance evidence |
| --- | --- | --- | --- |
| M01 Foundation cleanup | M01-01 environment/config; M01-02 audit stale scripts/assets and dependency peers; M01-03 common loading/error/empty/form states; M01-04 root startup/insets/accessibility baseline | Current app; Expo 57 docs | No broken commands/asset paths; physical-device API address documented; startup failures recover; lint/typecheck recorded |
| M02 Navigation shell | M02-01 finalize route/tab registry; M02-02 Home/Sell/Inventory/Activity/More shell and migration of Profile; M02-03 stacks/back/draft guards; M02-04 protected deep-link and fallback tests | M01; fixtures permitted in development | No duplicate public paths; tab/back/direct-link behavior verified on both OSes; unfinished modules visibly unavailable |
| M03 Identity/session | M03-01 secure storage + pure reducers; M03-02 real login/register/verification/recovery; M03-03 refresh/logout/revocation/cache cleanup; M03-04 session race and migration tests | M01; server auth phase 4 and shared contract | No demo token in real flow; restart/expiry/concurrent 401/logout tests; private data cleared |
| M04 Business context | M04-01 organization/create/join; M04-02 branch selection/switch; M04-03 permission/entitlement guard map; M04-04 cache/draft isolation | M02–03; server phases 5 and entitlement foundation | Two organizations/branches cannot leak cached data; revoked access and no-membership flows recover |
| M05 Catalog and contacts | M05-01 product lists/detail/editor; M05-02 category/brand/unit settings; M05-03 customers/suppliers and account summaries; M05-04 pagination/forms/media state checks | M04; server phase 6, later finance summaries | CRUD/archive tested against contract; missing/forbidden/conflicting records handled; large lists usable |
| M06 Inventory and purchasing | M06-01 balances/ledger/low-stock; M06-02 adjustments; M06-03 purchases/receipts/returns/payments; M06-04 reconciliation and history links | M05; server phases 7–8 and payment contracts | Correct branch stock changes after committed receipts/returns; invalid quantities/duplicate retries covered |
| M07 Sales and payments | M07-01 product-to-cart durable draft; M07-02 exact totals/checkout; M07-03 receipts/payments/returns/void; M07-04 idempotency/conflict/recovery tests | M05–06; server phase 9 | Purchase → stock → sale → partial payment → return journey reconciles to server; timeout never duplicates sale |
| M08 Dashboard, expenses, reports | M08-01 scoped real Home/Activity; M08-02 expenses; M08-03 permitted reports; M08-04 timezone/currency/error/freshness checks | M06–07; server phase 10 | Values reconcile to known fixture transactions; no placeholder metrics presented as live data |
| M09 Account and settings | M09-01 profile/security/sessions; M09-02 business/branches/team; M09-03 operational policies/preferences/help/privacy; M09-04 entitlements/subscription read state | M03–04; relevant server phases 4–5, 11 | Settings persist/reload; unauthorized direct links denied; no nonfunctional toggles; light-only behavior honest |
| M10 Offline sales and sync | M10-01 SQLite migrations/cache/drafts; M10-02 queue/replay/idempotency; M10-03 sync/conflict UI; M10-04 kill/restart/reconnect/switch tests | M07; server phase 12 and approved offline policy | Airplane-mode/restart/retry tests preserve drafts and create each accepted command exactly once |
| M11 Optional capabilities | M11-01 barcode manual/scanner path; M11-02 notification list/delivery; M11-03 exports/private files; M11-04 transfer workflow if selected | Core workflow; relevant server phases 7, 13, 16 | Permissions denied gracefully; jobs/files scoped; each selected capability has separate device/API evidence |
| M12 Quality and release | M12-01 regression/accessibility/performance; M12-02 error telemetry/privacy; M12-03 EAS environments/signing/versioning; M12-04 preview/release and launch checklist | Required M01–10; M11 only selected scope; server launch readiness | Android + iOS release evidence, no placeholder deployment IDs, critical journeys pass, known gaps accepted |

M02 shell work may proceed before M03 backend integration. API-dependent tasks remain blocked with a recorded dependency while independent UI and contract preparation continue. M09 account work can proceed earlier when its dependencies exist. Complete vertical slices rather than finishing all visual screens before any integration.

## 12. Required verification matrix

| Scenario | Automated evidence where practical | Android/iOS manual evidence |
| --- | --- | --- |
| Cold start/session restore | State/resolver and storage failure tests | Fresh install, valid/expired session, font failure/reduced motion |
| Auth and recovery | Error mapping, refresh single-flight, token rotation, logout races | Keyboard/autofill, reset link expired, app interrupted during request |
| Navigation | Route permissions, link destinations and safe fallbacks | Every tab, detail return, modal dismissal, hardware/swipe Back |
| Business context | Cache key isolation, late-response isolation, revoked membership | Switch with open draft, no branch, offline switch, direct cross-tenant link |
| Lists/forms | Pagination/search cancellation, field errors and conflict handling | Empty/long lists, keyboard, large text, refresh, retry |
| Financial workflow | Exact amounts, idempotency and unknown-result reconciliation | Repeated taps, interrupted checkout, partial payment and partial return |
| Offline | Queue transitions, migrations, restart recovery and replay ordering | Airplane mode, process kill, reconnect, rejected/conflicting command |
| Settings | Persisted values and denied actions | Denied OS permission, clear cache with pending command, sign out |
| Accessibility/performance | Focused component checks and measured profiling | TalkBack/VoiceOver, reduced motion, small display, representative catalog |
| Release | Lint/typecheck/build checks and environment validation | Real Android/iOS release install, CS icon/splash, links, update/relaunch |

Run `npx expo lint` and `npx tsc --noEmit` before declaring a task done. Add meaningful tests for session, tenant boundaries, money/idempotency and sync behavior when those implementations arrive; do not add tests that merely restate a static screen layout. No test framework is mandated before evaluating SDK-compatible options. Record exact commands and results, including warnings. A simulator-only result is not physical-device verification.

A feature is complete only when its UI and contract states, authorized navigation, persistence/cache consequences, Android/iOS checks, relevant tests and tracker evidence are finished. Record exceptions explicitly instead of ticking a whole phase complete.

## 13. Decisions to resolve before affected implementation

| ID | Decision | Proposed direction; not an approved product rule |
| --- | --- | --- |
| D01 | Final five tabs and permission-specific visibility | Home, Sell, Inventory, Activity, More |
| D02 | Guest/demo mode | Development fixtures only; no simulated production login |
| D03 | Registration, invitations and verification order | Follow server identity/membership lifecycle; no mobile-only state machine |
| D04 | Currency/timezone/tax/rounding/credit rules | Server-owned configuration; exact values confirmed before checkout |
| D05 | Offline selling and negative stock risk | Bounded approved policy; online payments/refunds initially |
| D06 | Launch scope: purchasing/admin/reports vs mobile cashier focus | Phased online MVP; later features explicitly excluded per release |
| D07 | Barcode/notifications/exports/transfers launch priority | Optional M11 slices until selected |
| D08 | Universal links, support contact and legal URLs | Confirm owned domains and reviewed content before release |
| D09 | Supported locale, translations and appearance | Light-only initially; externalized strings and business formatting |
| D10 | Device/session cleanup and pending-sale handling | Preserve recoverable scoped work; no silent queue deletion |
| D11 | EAS account/project, bundle IDs and release owners | Validate existing `com.coreshop.app`; replace placeholders when authorized |
| D12 | Backend readiness and contract drift | Read current source/OpenAPI each integration; record version/date |

These decisions do not prevent independent preparation. Ask only when a consequential product rule cannot be inferred from accepted contracts or the user's instructions.

## 14. Agent handoff checklist

Before editing: identify task ID, current evidence, relevant route and server contract, read matching SDK docs, inspect working tree and define a bounded acceptance check.

After editing: verify route reachability and state handling; run lint/typecheck and focused tests; record exact changed files, command results, device/build evidence, remaining dependencies, decisions and the next task in `mobileProgress.md`. Never overwrite another active change or relabel a blocked feature complete.

## 15. Reference documentation

Consult again at implementation time; Expo releases change APIs.

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo documentation index and misconception corrections](https://docs.expo.dev/llms.txt)
- [Expo Router introduction](https://docs.expo.dev/router/introduction/)
- [Expo Router authentication](https://docs.expo.dev/router/advanced/authentication/)
- [Expo Router JavaScript tabs](https://docs.expo.dev/router/advanced/tabs/)

This roadmap defines intended behavior. It is not a claim that the app is production ready or that any proposed server endpoint exists.
