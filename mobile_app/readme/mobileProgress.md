# Core Shop mobile — phase plan and progress

Created: 2026-10-16. Last audit: 2026-10-16.

Plan: [mobile implementation plan](mobilePlan.md). Product source: [full specification](../../readme/project_structure.md). Server coordination: [server progress](../../server/readme/serverProgress.md).

This versionable file mirrors the server tracker's phase/evidence approach. Documentation ignore rules were removed at the user's request; the canonical specification is in root `readme/`.

## M01 addition — UI/UX and static design first (current priority)

**Owner direction, 2026-10-16:** finish static UI/UX before dynamic/server integration. Preserve all existing progress. The original checkpoint, phase table, task ledger and verification history remain below unchanged; this addition takes precedence for the current work order.

Current next task: **M01-UI02-01 — design system tokens, reusable patterns and static-data foundation**. Existing environment-first next-step text below is historical and deferred, except for fixes necessary to run the static app. Existing M01–M12 task IDs are retained for later integration/hardening; none are automatically completed by this UI track.

Detailed requirements: [UI/UX static implementation plan](mobileUiUxPlan.md). All new phases are nested under the first phase, M01. No UI screen implementation was performed by this planning update.

### Required approach

- UI/UX skill: inspect available mobile design/system/performance skills, read the selected skill and record its source and use. No dedicated mobile UI/UX skill is currently listed; proceed with the documented standards and record that gap rather than pretending one is installed.
- Static first: every screen is navigable and interactive with explicit local scenarios, including validation, filters, sliders, sheets, transitions and error states. Server availability is not a prerequisite for this track.
- One data location: all mock records, slider/chart content, scenario presets and demo options live under `src/staticData/`, accessed through typed feature adapters. Do not scatter fixture arrays in route files. Theme/config/localization remain in their own modules.
- DRY: extend shared UI/layout components, compose reusable feature sections and extract shared interaction hooks. Route files stay thin. Avoid copied screens and premature universal abstractions.
- Motion from the start: shared motion tokens in UI02, screen-level interaction work in every phase, whole-app refinement in UI15. Include reduced motion, gesture interruption, keyboard coordination and accessible slider controls.
- Evidence before claims: track static UI, device/motion verification and later API integration separately. “Production-grade” is a target backed by concrete checks, not a label applied to fixture screens.

### Static UI/UX phase overview

| First-phase subphase | Scope | Status |
| --- | --- | --- |
| M01-UI01 | UX direction and screen inventory | Completed |
| M01-UI02 | Design system, reusable patterns and static-data foundation | Not started |
| M01-UI03 | Authentication UI and interactions | Not started |
| M01-UI04 | Business onboarding and context selection UI | Not started |
| M01-UI05 | Tab shell and Home dashboard UI | Not started |
| M01-UI06 | Catalog, products and reusable browsing UI | Not started |
| M01-UI07 | Sell tab, cart, checkout and receipt UI | Not started |
| M01-UI08 | Inventory tab and stock workflows UI | Not started |
| M01-UI09 | Activity tab and purchase workflows UI | Not started |
| M01-UI10 | Customers and suppliers UI | Not started |
| M01-UI11 | Expenses, reports and financial presentation UI | Not started |
| M01-UI12 | More tab and business settings UI | Not started |
| M01-UI13 | Profile, security and account UI | Not started |
| M01-UI14 | Supporting screens, sliders and edge-state coverage | Not started |
| M01-UI15 | Animation, transitions and interaction smoothness | Not started |
| M01-UI16 | Static UI/UX quality gate and dynamic handoff | Not started |

### Static UI/UX task ledger

All entries are new planned work; existing completed evidence and original checkboxes below remain untouched. Detailed acceptance criteria for each phase are in mobileUiUxPlan.md.

#### M01-UI01 — UX direction and screen inventory

- [x] M01-UI01-01: Inventory every route in mobilePlan.md; map each to a tab/module, role scenario and primary user goal. Record launch and later scope without silently dropping screens.
- [x] M01-UI01-02: Document user journeys for auth → business selection → Home → Sell → receipt, and Inventory → product → adjustment; include interruption and recovery.
- [x] M01-UI01-03: Record the available UI/UX skill name/source/version and applicable guidance, or its absence. Create a concise design brief, references, terminology and accessibility checklist.
- [x] M01-UI01-04: Define information hierarchy, phone wireframes, reusable pattern inventory and motion intent; use existing CS branding and theme as the baseline.

#### M01-UI02 — Design system, reusable patterns and static-data foundation

- [ ] M01-UI02-01: Define shared typography, spacing, colors, radius, elevations, icon sizes, hit areas and motion tokens; preserve readable large-text layouts.
- [ ] M01-UI02-02: Extend Screen/Button/TextField; add reusable header, card, list row, status badge, section, empty/error/loading state, sheet/dialog and form patterns when first needed.
- [ ] M01-UI02-03: Create src/staticData/ with typed fixtures, scenario presets and a single fixture access boundary; keep screen mock records out of route files.
- [ ] M01-UI02-04: Define shared presentation models, feature hooks and reusable motion primitives; provide a development-only pattern/scenario gallery outside src/app unless deliberately routed.

#### M01-UI03 — Authentication UI and interactions

- [ ] M01-UI03-01: Design login and registration with CS branding, clear field hierarchy, password visibility, keyboard/focus/autofill behavior and accessible errors.
- [ ] M01-UI03-02: Build forgot/reset password, verification/resend, expired link and success screens using explicit fixture states.
- [ ] M01-UI03-03: Implement reusable auth layout/form actions and local validation; support busy, invalid input, retry, disabled and completed states.
- [ ] M01-UI03-04: Add restrained screen entry/exit and button feedback, reduced-motion alternatives and safe Back navigation; local demo entry must not create or imply a real credential.

#### M01-UI04 — Business onboarding and context selection UI

- [ ] M01-UI04-01: Build organization chooser/create/join/invitation views and branch selection using typed business/member fixtures.
- [ ] M01-UI04-02: Design no-business, no-branch, multiple-business, expired-invite and revoked-access scenarios with clear recovery destinations.
- [ ] M01-UI04-03: Reuse chooser rows, form sections and selection hooks; keep selected demo business/branch in a scoped presentation state.
- [ ] M01-UI04-04: Add onboarding steps/progress, draft/Back behavior and any helpful swipeable introduction with accessible next/skip controls.

#### M01-UI05 — Tab shell and Home dashboard UI

- [ ] M01-UI05-01: Build Home, Sell, Inventory, Activity and More tabs; migrate Profile entry and resolve public route collisions.
- [ ] M01-UI05-02: Design Home business/branch header, daily summaries, quick actions, recent activity, stock alerts and chart/summary cards with coherent fixtures.
- [ ] M01-UI05-03: Build a reusable horizontal insight/action slider only where it serves a user goal; show position and explicit access without requiring a swipe.
- [ ] M01-UI05-04: Wire every tab/dashboard action to its intended static screen; retain tab state, safe areas and accessible selected/focus states.

#### M01-UI06 — Catalog, products and reusable browsing UI

- [ ] M01-UI06-01: Build search, filter chips, category selection, sort/filter sheet and paginated-looking local list through a real reusable list pattern.
- [ ] M01-UI06-02: Build product/variant details, image fallback/gallery slider, price/stock sections and create/edit/archive confirmation screens.
- [ ] M01-UI06-03: Build category/brand/unit management from the shared row/form/sheet patterns; keep data definitions in staticData.
- [ ] M01-UI06-04: Handle empty catalog, no results, long names, missing images, unavailable variant and limited-permission scenarios; preserve scroll/filters on return.

#### M01-UI07 — Sell tab, cart, checkout and receipt UI

- [ ] M01-UI07-01: Build fast product/variant selection, quantity controls, customer picker, cart badge and reusable sale-line component.
- [ ] M01-UI07-02: Build cart editing, discount/tax display, draft handling and checkout review with clearly simulated totals matching fixture money semantics.
- [ ] M01-UI07-03: Build payment-method selection, partial-payment/due states, receipt, sale details, return/refund/void review and unknown-result/conflict presentation.
- [ ] M01-UI07-04: Use local feature state for coherent edits and reset; provide press/add-to-cart feedback and sheet transitions without suggesting a real charge or completed server sale.

#### M01-UI08 — Inventory tab and stock workflows UI

- [ ] M01-UI08-01: Build stock list, low-stock filters, branch context, quantity/unit presentation and product/stock detail links.
- [ ] M01-UI08-02: Build ledger/history with source record navigation and reusable transaction timeline rows.
- [ ] M01-UI08-03: Build adjustment count/reason/review/outcome screens and simulated insufficient-stock/version conflict states.
- [ ] M01-UI08-04: Design transfer list/create/detail/receive/cancel states for the planned later capability; label capability scope and reuse selection/review patterns.

#### M01-UI09 — Activity tab and purchase workflows UI

- [ ] M01-UI09-01: Build Activity grouped timeline, type/status/date filters, search and authorized-category fixture scenarios.
- [ ] M01-UI09-02: Build purchase list, supplier/product selection, cost/quantity editor, receipt review and purchase details.
- [ ] M01-UI09-03: Build purchase return, outstanding supplier payment and conflict/error/success demonstration states.
- [ ] M01-UI09-04: Reuse transaction row, money summary, filter, quantity and confirmation patterns; ensure source links retain their originating filter context.

#### M01-UI10 — Customers and suppliers UI

- [ ] M01-UI10-01: Build customer and supplier lists, searches, detail summaries, create/edit and archive confirmations.
- [ ] M01-UI10-02: Design contact actions, transaction histories and receivable/payable summaries with distinct permission and empty states.
- [ ] M01-UI10-03: Reuse contact forms, relation picker, summary cards and history hooks while keeping customer/supplier business differences explicit.
- [ ] M01-UI10-04: Provide long labels, missing optional fields, duplicate/contact validation and local changes scenarios; do not fake phone/email external actions.

#### M01-UI11 — Expenses, reports and financial presentation UI

- [ ] M01-UI11-01: Build expense list/create/edit/detail, date/category filters and receipt attachment placeholders without fake uploads.
- [ ] M01-UI11-02: Build report directory and sales/profit/inventory/expense/balance report views with clear scope/date/timezone/currency.
- [ ] M01-UI11-03: Use reusable amount/date/filter/legend/chart-summary patterns; provide accessible text equivalents and no-data/limited-access/error states.
- [ ] M01-UI11-04: Create coherent report fixtures and export/job preview states; distinguish simulated presentation totals from future server financial authority.

#### M01-UI12 — More tab and business settings UI

- [ ] M01-UI12-01: Build More directory and grouped settings landing with account, business, operations and device sections.
- [ ] M01-UI12-02: Build business profile, branches, team/invites/member permission summary and catalog/sales policy settings.
- [ ] M01-UI12-03: Build preferences, notification preferences, local data controls and subscription/usage/limit displays using shared settings rows and form sections.
- [ ] M01-UI12-04: Wire simulated save/cancel/reload and guarded/disabled states; expose only supported appearance/language options and no pretend billing or destructive live operation.

#### M01-UI13 — Profile, security and account UI

- [ ] M01-UI13-01: Build profile overview/edit with reusable avatar, identity fields and validation patterns.
- [ ] M01-UI13-02: Build security/change-password/reauthentication views and session/device list with local revoke scenarios.
- [ ] M01-UI13-03: Design demo sign-out, switch business, no-membership account access and pending-draft warning interactions.
- [ ] M01-UI13-04: Build help/about/privacy/terms/contact screens using genuine supplied content or explicit content-pending states; do not invent legal promises or support details.

#### M01-UI14 — Supporting screens, sliders and edge-state coverage

- [ ] M01-UI14-01: Build notification list/detail/deep-link preview, sync queue/conflict views and offline/stale banners from static scenarios.
- [ ] M01-UI14-02: Build barcode manual/scanner-permission preview, private-file/export status and attachment previews as scoped design states.
- [ ] M01-UI14-03: Audit all sliders/carousels, sheets, dialogs, menus and pickers for gesture conflicts, accessible controls and empty/single/multiple item behavior.
- [ ] M01-UI14-04: Complete not-found, forbidden, deleted record, timeout, empty/no-results, maintenance/update and permission-denied designs where relevant; no unresolved dead navigation.

#### M01-UI15 — Animation, transitions and interaction smoothness

- [ ] M01-UI15-01: Apply shared motion tokens/primitives to stack transitions, tabs, sheets, buttons, fields, cards, sliders and feedback; eliminate one-off competing presets.
- [ ] M01-UI15-02: Coordinate route/sheet/keyboard/list transitions, cancel interrupted animation work and preserve state during rapid taps, swipe-back and tab switching.
- [ ] M01-UI15-03: Honor reduced motion and screen-reader focus; no auto-playing information slider without pause/control, and no animation required to understand status.
- [ ] M01-UI15-04: Profile representative release-like static flows on Android/iOS; fix dropped frames, image/layout shifts, nested scroll problems and excessive rerenders with recorded evidence.

#### M01-UI16 — Static UI/UX quality gate and dynamic handoff

- [ ] M01-UI16-01: Audit every route/tab/settings link against the screen registry, scenario matrix and critical user journeys; record screenshots/video and unresolved visual gaps.
- [ ] M01-UI16-02: Verify Android/iOS keyboard/insets/Back/gestures, large text, contrast, TalkBack/VoiceOver, reduced motion and representative long lists.
- [ ] M01-UI16-03: Audit DRY boundaries, reusable components/features/hooks, staticData ownership, fixture relations and absence of network/production side effects.
- [ ] M01-UI16-04: Run lint/typecheck and meaningful navigation/state checks; record per-screen UI verification and a presentation-model-to-future-contract handoff without claiming API readiness.

### UI/UX evidence and completion gate

For each completed task record: route/screen, fixture preset, reused components/features/hooks, UI/UX skill applied or unavailable, motion behavior, reduced-motion result, Android/iOS device/build, screenshot/video location, checks and remaining gaps. Store evidence paths, not unsupported statements such as “smooth on all phones.”

| Screen / route | UI task ID | Fixture scenario | UI implementation | Android / iOS evidence | Motion / accessibility | API integration |
| --- | --- | --- | --- | --- | --- | --- |
| Populate as screens are implemented | — | — | Not started | Not recorded | Not recorded | Deferred |

- [ ] All required static screens and tab-wise journeys are designed and locally interactive.
- [ ] All fixture content is centralized in `src/staticData/` and related records agree.
- [ ] Reusable UI/layout, feature patterns and hooks pass a DRY audit.
- [ ] Sliders, sheets, navigation, feedback and animation have consistent, interruptible behavior.
- [ ] Reduced motion, keyboard, safe areas, large text and screen-reader checks are recorded.
- [ ] Android/iOS release-like smoothness evidence and resolved jank findings are recorded.
- [ ] Lint/typecheck and relevant interaction checks are recorded; known exclusions are explicit.
- [ ] Dynamic integration starts only after the static quality gate, relevant server readiness and current user direction are satisfied.

### Planning-addition verification — 2026-10-16

Scope: added this first-phase UI/UX track and mobileUiUxPlan.md; added a priority notice to mobilePlan.md. Existing progress entries are retained verbatim. `src/staticData/` is a planned implementation deliverable in UI02, not a directory or fixture implementation claimed by this documentation task.

Validation: original progress and plan content verified unchanged after removing only the added blocks; all 64 new task IDs match across tracker and UI/UX plan; local links and Markdown fences passed. Typecheck passed. Lint passed with 0 errors and 2 existing warnings in `src/hooks/useInfiniteScroll.ts`. No screen, animation or dynamic integration is marked complete by this addition.

### 2026-10-16 — M01-UI01 UX direction, screen inventory & user journeys

State: Verified (Design & Specification)
Scope and authorization: Phase 1 (M01-UI01-01 through M01-UI01-04) as authorized by user instruction.
Files created/updated:
- `readme/mobileUxDirection.md` (Created): Complete 62-route inventory, POS & inventory user journey sequence diagrams with interruption handling, Swiss minimalism design brief, bilingual terminology dictionary, mobile accessibility (WCAG AA) checklist, ASCII phone wireframes, reusable pattern inventory, and motion tokens.
- `readme/mobileProgress.md` (Updated): M01-UI01 subphase and tasks marked complete; next task set to M01-UI02-01.
Skills applied:
- `ui-ux-pro-max`: Design search executed for retail operations; applied Swiss minimalism, neutral slate surfaces (`#FFFFFF`/`#F8FAFC`), emerald primary (`#059669`), WCAG AA contrast standards (Slate-900 on white = 16.1:1).
- `expo-design-system`: Defined component variant patterns and DRY hierarchy for M01-UI02.
- `expo-animation`: Native driver and worklet requirements recorded for screen/sheet transitions and reduced-motion fallback.
Validation:
- Documentation integrity: Markdown balanced, links validated.
- `npx expo lint`: 0 errors.
- `npx tsc --noEmit`: 0 errors.
Next bounded task: **M01-UI02-01 — design system tokens, reusable patterns and static-data foundation**.

---

## Current checkpoint

**Documentation baseline prepared. Existing application is a mobile prototype, not an integrated retail MVP.**

Current phase: M01, existing foundation partial; planned cleanup not started by this documentation task.
Next bounded slice: **M01-01 — public environment configuration and a documented device-to-server connectivity check**, followed by M01-02. Navigation design can proceed as M02-01 without waiting for business APIs.

Server dependency: the inspected server tracker records foundation verification and future business phases. Server work was changing during this audit; recheck its tracker, current source and OpenAPI before integration. Do not infer that auth/business endpoints exist from the mobile endpoint definitions.

## How agents must maintain this tracker

1. Read `AGENTS.md` and `mobilePlan.md`; inspect current files and user authorization.
2. Select one task ID or bounded slice. Record its dependency and acceptance check before implementation.
3. Record actual work and evidence below; update phase/task state without inflating progress.
4. Use `Not started`, `In progress`, `Blocked`, `UI only`, `Integrated`, `Verified`, or `Accepted`. Blocked means a named missing dependency, not merely unfinished work.
5. `Verified` requires acceptance evidence. `Accepted` requires explicit owner review; never infer it from successful commands.
6. A checkbox means its stated deliverable is satisfied; checking a prototype inventory item does not complete the feature phase.
7. Record checkpoint/review items at the end of a bounded slice. Follow the user's current instruction on continuation; this file does not add a mandatory permission gate.
8. Update dates, evidence, next task, decisions and blockers after every implementation session. Avoid percentage estimates until tasks are consistently sized.

## Baseline evidence: what exists

| Item | State | Source / limitation |
| --- | --- | --- |
| Android/iOS Expo configuration | Implemented configuration | `app.json`; web script removed, supported platforms explicit |
| CS icon and native splash references | Implemented configuration | `assets/images/cs-icon.png`; rebuilt-device appearance not verified in this documentation task |
| React/Expo starter image cleanup | Implemented | Only CS image remains under assets at audit |
| Fonts/providers/startup animation | Prototype | `src/app/_layout.tsx`, `components/layout/AnimatedSplashScreen.tsx`; startup and accessibility device evidence pending |
| Auth forms | UI only | Login uses `demo-token`; registration simulates completion |
| Persisted session and private redirect | Prototype | `auth.slice.ts`, `(private)/_layout.tsx`; AsyncStorage is not the target secure secret store |
| Auth endpoint declarations and refresh wrapper | Unintegrated | `auth.api.ts`, `API/API.ts`; refresh endpoint discrepancy and persistence gaps |
| Home/Profile tabs | UI only | `(private)/(tabs)/_layout.tsx`; proposed five-tab shell does not exist |
| Home cards/actions | UI only | Placeholder values; action rows are not operational links |
| Shared Screen/Button/TextField and tokens | Implemented base components | States, large text, insets and both-platform coverage incomplete |
| Catalog, stock, contacts, sales, purchases, reports | Not started | No business routes/API modules present |
| Settings, memberships, permissions, entitlements, English/Bangla | Not started | No dedicated implementation present |
| Offline SQLite/queue/sync conflict UI | Not started | No installed local database/sync implementation |
| Release profiles | Partial configuration | `eas.json` and `app.json` contain deployment/submission placeholders |

## Phase overview

| Phase | Deliverable | Status | Dependencies |
| --- | --- | --- | --- |
| M01 | Environment, foundation cleanup and UI/startup baseline | Partial existing foundation; planned tasks not started | Current app and matching SDK docs |
| M02 | Route/tab shell, safe navigation and deep links | Not started; two-tab prototype exists | M01; business fixtures may be development-only |
| M03 | Real identity and session lifecycle | Not started; forms/client prototype exists | Server auth contract |
| M04 | Organization/branch context and permissions | Not started | M02–03; server membership/branch contracts |
| M05 | Catalog, reference data, customers and suppliers | Not started | M04; catalog/contact and ledger-summary contracts |
| M06 | Inventory and purchasing | Not started | M05; stock/purchase/payment contracts |
| M07 | Sales, payments, returns and reconciliation | Not started | M05–06; sales/payment contracts |
| M08 | Real dashboard/activity, expenses and reports | Not started | M06–07; report contracts |
| M09 | Profile/security, business settings and preferences | Not started | M03–04; feature-specific contracts |
| M10 | Scoped offline cache, sale queue and sync recovery | Not started | M07; server sync/idempotency and approved policy |
| M11 | Selected barcode, notifications, files, exports, transfers | Not started; optional per release | Product scope + relevant server capability |
| M12 | Regression, accessibility, performance and release | Not started | Required feature phases and server launch readiness |

## Task ledger

All unchecked tasks below are planned. Existing prototype evidence is recorded above rather than counted as completed integration.

### M01 — foundation

- [ ] M01-01: Move API address to public environment configuration; document physical Android/iOS and emulator connectivity.
- [ ] M01-02: Audit dependency peers, stale starter/reset/icon scripts, assets, manifest and lockfile consistency; preserve required compatibility dependencies.
- [ ] M01-03: Define reusable loading/empty/error/offline/forbidden/submitting components and form behavior.
- [ ] M01-04: Verify hydration/font/storage failure paths, startup animation, reduced motion, keyboard and safe areas on both platforms.

### M02 — navigation

- [ ] M02-01: Confirm route registry, five tabs and permission-based fallback; resolve grouped public path collisions.
- [ ] M02-02: Implement the operational shell and move Profile under private account routes without breaking links.
- [ ] M02-03: Implement headers, list/detail return, modal rules, unsaved-draft handling and Android/iOS Back behavior.
- [ ] M02-04: Verify cold/warm deep links, auth return destination, missing/denied records and no redirect loops.

### M03 — authentication

- [ ] M03-01: Secure session persistence, migration from AsyncStorage and pure reducers with awaited side effects.
- [ ] M03-02: Replace simulated auth with confirmed login/register/verification/recovery contracts and field/domain errors.
- [ ] M03-03: Verify refresh rotation/concurrency, session validation, logout/revocation and sensitive cache cleanup.
- [ ] M03-04: Add focused storage/session/race tests; verify restart, offline and expired-session UI.

### M04 — business context

- [ ] M04-01: Organization chooser/create/join/invitation lifecycle, including no-membership recovery.
- [ ] M04-02: Authorized branch selection/switch with active context visible on operational screens.
- [ ] M04-03: Central permission/entitlement action map and guards for direct links and unavailable tabs.
- [ ] M04-04: Isolate queries/drafts by user, organization and branch; test stale requests and revoked access.

### M05 — catalog and contacts

- [ ] M05-01: Product search/list/detail/create/edit/archive and variant selection.
- [ ] M05-02: Category, brand and unit administration with safe historical references.
- [ ] M05-03: Customer/supplier list, create, detail and edit; integrate financial summaries only when their contracts exist.
- [ ] M05-04: Pagination, cancellation, form conflicts, large lists and image fallback evidence.

### M06 — inventory and purchasing

- [ ] M06-01: Branch balances, low stock and immutable ledger with source links.
- [ ] M06-02: Permission-controlled adjustments with reasons, review and server reconciliation.
- [ ] M06-03: Purchase list/create/detail, receipt, return and supplier payment lifecycle.
- [ ] M06-04: Verify stock/financial effects, invalid quantities and duplicate/unknown-result handling.

### M07 — sales and payments

- [ ] M07-01: Search-to-cart flow, quantities/variants/customer and durable scoped sale drafts.
- [ ] M07-02: Exact monetary semantics, checkout review, payment methods and partial credit policy.
- [ ] M07-03: Sale history/receipt, later payment, return/refund and void with permissions.
- [ ] M07-04: Test repeated submission, timeouts, stock/price conflicts and end-to-end reconciliation.

### M08 — overview and reporting

- [ ] M08-01: Replace Home metrics/actions and Activity with real scoped data and working links.
- [ ] M08-02: Expense list/create/detail/correction with authorized audit semantics.
- [ ] M08-03: Sales/profit/inventory/expense/balance reports with permission-specific data.
- [ ] M08-04: Verify business timezone, currency, filter bounds, stale data and fixture reconciliation.

### M09 — account and settings

- [ ] M09-01: Profile editing, password/security/session management and sign-out lifecycle.
- [ ] M09-02: Business identity, branches, team/invitations and permission summaries.
- [ ] M09-03: Sales/catalog policies, device preferences, help/about/privacy and safe local-data management.
- [ ] M09-04: Subscription/usage/entitlement states; no fake billing actions or unsupported appearance switches.

### M10 — offline and sync

- [ ] M10-01: SDK-compatible SQLite schema/migrations and scoped product/stock caches/drafts.
- [ ] M10-02: Durable command queue, idempotency, replay, reconciliation and bounded retries.
- [ ] M10-03: Visible pending/failure/conflict screens with safe manual recovery.
- [ ] M10-04: Airplane mode, process kill, reconnect, duplicate replay, switch/logout and cache-clear safety checks.

### M11 — optional capabilities

- [ ] M11-01: Barcode flow with manual entry and denied-camera fallback, if selected.
- [ ] M11-02: Scoped notification list/delivery/preferences and safe destination links, if selected.
- [ ] M11-03: Private media, asynchronous export/share/download workflows, if selected.
- [ ] M11-04: Multi-branch transfer lifecycle and permissions, if selected.

### M12 — release readiness

- [ ] M12-01: Critical regression suite, TalkBack/VoiceOver, large text and measured release performance.
- [ ] M12-02: Safe error reporting/request diagnostics, redaction and reviewed privacy/retention content.
- [ ] M12-03: Authorized EAS project/environment/signing/version/update configuration; replace placeholder IDs.
- [ ] M12-04: Android and iOS release install verification, launch checklist and known-gap acceptance.

## Dependencies and known gaps

| ID | Gap | Impact / next action | State |
| --- | --- | --- | --- |
| B01 | Auth screens are simulated | Implement M03 only against a verified server contract; shell work can continue | Open |
| B02 | Refresh route differs between client and product example | Confirm actual endpoint/body/rotation before integration | Open |
| B03 | Localhost API constant | Physical-device connectivity not portable; fix M01-01 | Open |
| B04 | Secrets persisted in AsyncStorage, side effects in reducers | M03-01 secure persistence/migration and failure handling | Open |
| B05 | No tenant/branch/permission context | Block live multi-tenant business integration until M04 | Open |
| B06 | No business API integration evidence | Track each server contract, not a single blanket backend-ready claim | Open |
| B07 | EAS/submission placeholders | Prevent verified production release status until configured | Open |
| B08 | Icon generator expects removed/missing source assets | Audit M01-02 before advertising `generate-icons` as usable | Open |
| B09 | Documentation previously ignored by Git | Ignore rules removed; root specification and app trackers are eligible for commit (no commit made) | Resolved documentation policy |

## Contract readiness register

Update with actual endpoint/schema/version and verification date. Planned paths from the product specification do not qualify as evidence.

| Contract area | Mobile consumer | Verified server evidence | Status |
| --- | --- | --- | --- |
| Login/register/me/refresh/logout/recovery | M03 | Not yet recorded | Pending |
| Organizations/memberships/branches/permissions | M04/M09 | Not yet recorded | Pending |
| Catalog/reference data/customer/supplier | M05 | Not yet recorded | Pending |
| Stock/ledger/adjustments/purchases/supplier payables | M06 | Not yet recorded | Pending |
| Sales/receivables/payments/allocations/returns/idempotency | M07 | Not yet recorded | Pending |
| Dashboard/activity/expenses/reports | M08 | Not yet recorded | Pending |
| Entitlements/settings/sessions | M09 | Not yet recorded | Pending |
| Sync queue/acknowledgements/conflicts | M10 | Not yet recorded | Pending |
| Notifications/files/export jobs/transfers | M11 | Not yet recorded | Optional pending scope |

## Decision log

Decision descriptions and proposed defaults are in `mobilePlan.md`, section 13. All are proposed until acceptance or a verified contract establishes the answer.

| IDs | Topic | Current state |
| --- | --- | --- |
| D01–D03 | Tabs, demo policy, registration/verification | Proposed; no implementation acceptance recorded |
| D04–D05 | Money, taxes, credit and offline sales | English/Bangla and Baki scope confirmed by user; exact financial policy still server-owned |
| D06–D07 | Mobile launch scope and optional capabilities | Proposed phased scope |
| D08–D09 | Domains/legal/support/locales/appearance | English/Bangla confirmed; domains/support and appearance details remain open, current app light-only |
| D10–D12 | Pending-command cleanup, release ownership, contract drift | Resolve during relevant phase |

## Verification record

### Documentation baseline — 2026-10-16

Changes: created `mobilePlan.md` and `mobileProgress.md`; inspected actual mobile routes, auth/session transport, app/release configuration, product specification and server tracker. No mobile feature or server code was changed by this documentation task.

| Check | Result |
| --- | --- |
| Actual vs proposed route distinction | Existing Home/Profile and simulated auth recorded separately from full proposed route registry |
| Plan/task cross-reference | Every M01–M12 task ID has an implementation phase and tracker entry |
| Local documentation links | Passed; relative targets exist, Markdown fences balanced, all 48 task IDs present in both documents |
| `npx expo lint` | Passed; 0 errors, 2 existing warnings in `src/hooks/useInfiniteScroll.ts` (unused disable and effect dependencies) |
| `npx tsc --noEmit` | Passed |
| Device/API integration tests | Not run; documentation task, no feature completion claimed |
| Owner acceptance | Not recorded |

## Required scope update — 2026-10-16

State: documentation updated; no new mobile feature implemented. Preserve M01–M12 task IDs and recorded prototype evidence. The expanded task-to-phase contract is in `mobilePlan.md`, “Core bilingual and Baki implementation contract”.

- [ ] M01/M03/M09: English/Bangla translation catalogs, validation/error keys, Bangla fonts, onboarding/settings switching and per-user/local offline persistence.
- [ ] M05/M06/M07: Complete customer/supplier profiles, ledgers, collections/payments, allocations, histories/returns and statements; configurable methods and immutable reversal flows.
- [ ] M08: Required dashboard KPIs, total/party outstanding, aging, collection, credit-sales and purchase-payable reports with date/as-of/branch scope.
- [ ] M07/M08: English, Bangla and bilingual receipt/statement print/export; Unicode UGC preserved.
- [ ] M08/M11: Core due-today/overdue/X-days/long-overdue UI; future external reminder adapters remain optional.
- [ ] M10: SQLite ledger/payment/allocation + queue atomicity, practical offline collections, stable commands and posted/pending reconciliation without duplicate financial effects.
- [ ] M12: Both-language input/search/format/document/device checks and concurrent/replayed payment, reversal, rollback and tenant-isolation acceptance evidence.

Server contract readiness remains Pending for ledger/accounts, payments/allocations/reversals, configurable methods, as-of reports, preferences, document language and offline acknowledgements. The observed Phase 2 server source has tenant/database/private-file foundation; this does not establish business/auth endpoint availability. No ledger/localization integration is verified by this documentation change.

### Documentation update evidence

Moved the existing full specification into `../../readme/project_structure.md`, preserving its architecture under Server/Web/App/Workflow. Updated mobile plan/tracker and server tracker, repaired links and removed documentation ignore rules. Existing runtime work is untouched. Verification on 2026-10-16:

| Check | Result |
| --- | --- |
| Canonical specification | Four requested main sections; all 65 baseline subsections retained, plus end-to-end workflows |
| Documentation integrity | Seven Markdown documents: balanced fences and 26 relative links resolving; move and required feature markers checked |
| Git visibility | Root specification and mobile/server progress files not ignored; documentation is trackable |
| `npx expo lint` | Passed, 0 errors; 2 existing warnings in `src/hooks/useInfiniteScroll.ts` (unused disable and effect dependencies) |
| `npx tsc --noEmit` | Passed |
| Device/API/database checks | Not run by this documentation task; no new runtime capability or owner acceptance claimed |

The newer static UI-first M01 direction recorded above remains the current work order. Financial/localization requirements apply to its fixture screens and later integration; this update does not restart or replace that track.

## Implementation-session template

Copy this block for each bounded slice; replace placeholders rather than leaving ambiguous completion claims.

```markdown
### YYYY-MM-DD — task ID and concrete outcome

State: In progress / UI only / Integrated / Verified / Blocked / Accepted
Scope and authorization:
Files changed:
Server contract evidence and version/date:
Behavior completed:
Commands and exact results:
Android device/build/scenarios:
iOS device/build/scenarios:
Known limitations and dependencies:
Decisions made, with source:
Review items / owner acceptance if explicitly given:
Next bounded task:
```

## Release gate

- [ ] Required phases selected for this release are verified; optional exclusions documented.
- [ ] No demo auth, false success, placeholder financial data or dead primary actions.
- [ ] Tenant/permission/session and unknown-result financial cases pass.
- [ ] Pending offline commands survive restart and cannot duplicate accepted operations.
- [ ] Lint/typecheck and relevant tests/builds pass; warnings/gaps recorded.
- [ ] Android/iOS physical release-build evidence recorded, including navigation, accessibility, icon and splash.
- [ ] Server readiness, production HTTPS, configuration, privacy/support and release ownership confirmed.
- [ ] Owner acceptance recorded for the release; no release is published solely because a checklist exists.

## Project-local UI/UX skills installed — 2026-10-16

The earlier statement that no dedicated UI/UX skill was available is retained as historical evidence. Seven reviewed skills are now installed under `.agents/skills/`: `ui-ux-pro-max`, `expo-design-system`, `expo-native-ui`, `expo-ui`, `expo-router`, `expo-animation`, and `react-native-skills` (Vercel skill name `vercel-react-native-skills`). See [the shared usage guide](../.agents/README.md) and [pinned source manifest](../.agents/skills-lock.json).

Installation is project-local; `.claude/skills`, `.gemini/skills`, and `.agent/skills` point to the same canonical files. `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` direct agents to the shared guidance. NativeWind/theme conventions, static-first order, centralized fixtures, DRY, readable contrast and reduced-motion/device checks take precedence over conflicting generic examples. No screen-design task is marked complete by installing these skills.

Installation verification: all seven skill manifests/file hashes and three project-relative discovery links passed; local design-system, contrast and React Native animation searches returned results. Typecheck passed. Lint passed with the two existing useInfiniteScroll warnings. CLI discovery has not been exercised in every third-party agent; reload sessions or read the shared guide explicitly.
