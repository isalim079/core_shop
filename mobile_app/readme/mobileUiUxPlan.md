# Core Shop mobile — UI/UX and static design first

Added: 2026-10-16, following the owner's explicit sequencing correction. This is the current first implementation track, nested under M01. Existing M01–M12 progress and history remain preserved.

Companions: [progress tracker](mobileProgress.md), [broader implementation plan](mobilePlan.md), [product specification](../../readme/project_structure.md).

## Priority and completion meaning

Build the complete static mobile experience first: UX journeys → shared design system/data → auth/onboarding → tab-by-tab features → animation/smoothness → device verification. Dynamic server integration follows the static UI quality gate, after the relevant server capabilities are ready. A server being available earlier does not change this order without new user direction.

“Static” means a fully navigable, interactive experience backed by local fixtures. It includes validation, local draft edits, sliders, filters, sheets, simulated status changes and error states. It does not mean screenshots or disconnected decorative pages. No fixture action sends a real sale/payment, authenticates a real account, or silently mutates production data.

Current next task: **M01-UI01-01 — route/screen inventory and user-journey design**. The older environment-first next-task entry is retained as historical baseline and is deferred by this addendum. Necessary lint/build/config fixes may be done to unblock static work; real API integration is not the first phase deliverable.

## UI/UX skill workflow

At the start of each design subphase, inspect available skills and apply a suitable mobile UI/UX/design-system/React Native performance skill if present. Read its actual instructions and record name, source/path, applicable advice and deviations in the tracker. Do not claim a skill was used merely because the term appears in this plan.

No dedicated mobile UI/UX skill is listed in the current session. This is a recorded capability gap, not a reason to stop design work. Use the design standards here until an appropriate skill is available; use skill discovery when needed, verify mobile/Expo suitability, and do not install a skill or dependency solely because its name matches. A web-only skill must not introduce DOM/CSS-only interactions into the mobile app. Image-generation guidance is relevant for needed raster artwork, not a substitute for screen UX.

Before writing any Expo/React Native animation, gesture or routing implementation, read the installed Expo major and version-matched docs as required by AGENTS.md. Prefer the existing compatible navigation/animation stack before adding libraries. Record actual skill use separately from future recommendations.

## Architecture: DRY without premature abstraction

- Route files compose screens and resolve params; they do not embed business fixture arrays, duplicated API logic or bespoke versions of shared layout.
- `src/components/ui/` owns generic primitives; `src/components/layout/` owns screen/header/layout patterns. Extend existing components before introducing alternatives.
- `src/features/<domain>/` may own reusable feature screens/sections, presentation models, local interaction logic and domain hooks when a domain needs them. Keep existing `src/store/features/` for Redux/RTK Query responsibilities; do not duplicate the same responsibility in both places.
- `src/hooks/` owns genuinely cross-feature behavior. Feature-specific hooks stay near their feature. Extract stable repeated behavior, not a generic wrapper around every single function.
- Compose shared patterns for list/search/filter, quantity/amount input, contact selection, transaction review, settings rows and feedback. Share behavior as well as markup; avoid one giant configurable screen that obscures domain rules.
- Tokenize visual and motion values. Do not scatter different spacing, durations, colors or status labels across near-identical components.
- Use typed presentation boundaries so fixture adapters can later be replaced by API adapters without rewriting layout. Keep server DTO assumptions out of reusable components; do not promise exact future schema compatibility.

## Single staticData folder

All mock domain records, chart points, slider content, scenario presets, demo identities, permissions, sample options and local placeholder metadata belong under **`src/staticData/`**. Existing visual tokens, translations and real app configuration remain in their appropriate theme/localization/config modules; they are not duplicate domain fixture sources.

Proposed structure, created as work needs it:

```text
src/staticData/
  index.ts                    # intentional exports
  README.md                   # ownership, scenario and replacement conventions
  scenarioTypes.ts            # fixture scenario types, not server DTOs
  scenarios.ts                # named happy/empty/error/offline/permission presets
  auth.ts                     # demo identities and auth outcomes; no real credentials
  organizations.ts            # related businesses, branches and memberships
  dashboard.ts                # summaries/insight-slider content derived where practical
  catalog.ts                  # products, variants, categories, brands and units
  inventory.ts                # balances, movements and transfer examples
  sales.ts                    # sale/payment/return and cart-seed examples
  purchases.ts                # purchase/receipt/return examples
  contacts.ts                 # customers and suppliers
  expenses.ts reports.ts
  settings.ts                 # demo preferences, team and entitlement states
  notifications.ts sync.ts
```

Fixtures must have stable IDs, consistent relationships, deterministic times/currencies and realistic edge cases. Reuse the same catalog/contact/branch IDs across journeys. Prefer derived dashboard/report summaries over contradictory duplicated values. Use a fixed fixture clock instead of random data or current-time-sensitive snapshots.

Expose fixture data through a thin, typed access boundary or feature adapter. Keep source records immutable and place user edits in demo feature state; reset scenarios explicitly. Any simulated loading/failure/delay must be configurable and cancellable, not an unconditional timer scattered across screens. Fixture mode must be clearly identified in development/preview and must not silently become a production fallback when the network fails.

During the static track, no live backend is required for screen completion. Later, switch data sources at the adapter boundary, map server contracts, add real persistence/auth and keep fixture scenarios for development verification. Production must exclude or disable demo entry points and fixture-only controls.

## Motion, sliders, transitions and performance standard

Define motion in the design-system phase and implement it progressively in every screen phase; M01-UI15 is the whole-app refinement pass, not the first time animation is considered.

| Interaction | UX requirement | Verification |
| --- | --- | --- |
| Stack push/pop/replace | Consistent shared defaults; Back/replace semantics stay predictable | Rapid navigation, interrupted swipe, direct-entry fallback |
| Tabs | Immediate selected feedback, preserved local state and insets | Repeated switches with keyboard/open draft |
| Sheet/dialog | Stable backdrop/focus/dismissal; coordinate keyboard and scroll | Drag/dismiss/Back with pending edits |
| Press/field feedback | Subtle feedback with disabled/busy/error states | Repeated taps cannot double-submit local flow |
| Sliders/carousels | Clear purpose, stable page/position, next/previous alternatives | Empty/one/many items, screen reader, interrupted swipe |
| List/filter changes | Stable keys, bounded renders and no lost scroll context | Representative long fixtures and rapid filtering |
| Loading/success/error | Informative state; no decorative delay or endless animation | Reduced motion, cancel, retry, background/foreground |
| Splash/entry | Never prolong readiness to finish branding animation | Cold/warm start, font/storage failure, reduced motion |

Choose duration/easing/spring tokens from device evaluation and record them; do not claim universal smoothness from arbitrary numbers. Prefer inexpensive transform/opacity effects where appropriate, avoid unnecessary layout work, size images before render, and keep expensive filtering/formatting out of animation-critical work. Profile before optimizing.

Target visually stable interactions within the device frame budget (about 16.7 ms at 60 Hz, 8.3 ms at 120 Hz); these are evaluation targets, not achieved measurements. Record device, OS, build type, data size, flow and observed frame issues. Release-like runs are required to assess performance; development-mode impressions alone are insufficient.

Reduced motion must preserve all information and actions. Auto-advance is not a default carousel requirement. If used for a justified case, provide pause and accessible manual controls; never auto-dismiss critical errors or move screen-reader focus unexpectedly.

## Sixteen static design subphases

All phases below are planned; writing this document completes none of their implementation tasks. Each phase has four task IDs recorded in the progress tracker.

### M01-UI01 — UX direction and screen inventory

Goal: Define the mobile experience before polishing individual screens.

- **M01-UI01-01:** Inventory every route in mobilePlan.md; map each to a tab/module, role scenario and primary user goal. Record launch and later scope without silently dropping screens.
- **M01-UI01-02:** Document user journeys for auth → business selection → Home → Sell → receipt, and Inventory → product → adjustment; include interruption and recovery.
- **M01-UI01-03:** Record the available UI/UX skill name/source/version and applicable guidance, or its absence. Create a concise design brief, references, terminology and accessibility checklist.
- **M01-UI01-04:** Define information hierarchy, phone wireframes, reusable pattern inventory and motion intent; use existing CS branding and theme as the baseline.

Acceptance: A complete screen/journey matrix and consistent wireframes exist; primary actions and tab ownership are explicit.

### M01-UI02 — Design system, reusable patterns and static-data foundation

Goal: Build shared foundations used by every later screen.

- **M01-UI02-01:** Define shared typography, spacing, colors, radius, elevations, icon sizes, hit areas and motion tokens; preserve readable large-text layouts.
- **M01-UI02-02:** Extend Screen/Button/TextField; add reusable header, card, list row, status badge, section, empty/error/loading state, sheet/dialog and form patterns when first needed.
- **M01-UI02-03:** Create src/staticData/ with typed fixtures, scenario presets and a single fixture access boundary; keep screen mock records out of route files.
- **M01-UI02-04:** Define shared presentation models, feature hooks and reusable motion primitives; provide a development-only pattern/scenario gallery outside src/app unless deliberately routed.

Acceptance: At least two different screens reuse the same primitives; fixture scenarios switch predictably without API calls.

### M01-UI03 — Authentication UI and interactions

Goal: Finish the public account experience with local scenario behavior.

- **M01-UI03-01:** Design login and registration with CS branding, clear field hierarchy, password visibility, keyboard/focus/autofill behavior and accessible errors.
- **M01-UI03-02:** Build forgot/reset password, verification/resend, expired link and success screens using explicit fixture states.
- **M01-UI03-03:** Implement reusable auth layout/form actions and local validation; support busy, invalid input, retry, disabled and completed states.
- **M01-UI03-04:** Add restrained screen entry/exit and button feedback, reduced-motion alternatives and safe Back navigation; local demo entry must not create or imply a real credential.

Acceptance: Every auth screen is navigable in static mode; errors/keyboard/motion states are reproducible on both platforms.

### M01-UI04 — Business onboarding and context selection UI

Goal: Make first-use and context switching understandable without server dependencies.

- **M01-UI04-01:** Build organization chooser/create/join/invitation views and branch selection using typed business/member fixtures.
- **M01-UI04-02:** Design no-business, no-branch, multiple-business, expired-invite and revoked-access scenarios with clear recovery destinations.
- **M01-UI04-03:** Reuse chooser rows, form sections and selection hooks; keep selected demo business/branch in a scoped presentation state.
- **M01-UI04-04:** Add onboarding steps/progress, draft/Back behavior and any helpful swipeable introduction with accessible next/skip controls.

Acceptance: New and returning demo users reach the appropriate static app state; context changes update visible fixture data coherently.

### M01-UI05 — Tab shell and Home dashboard UI

Goal: Make the main app coherent and useful to explore.

- **M01-UI05-01:** Build Home, Sell, Inventory, Activity and More tabs; migrate Profile entry and resolve public route collisions.
- **M01-UI05-02:** Design Home business/branch header, daily summaries, quick actions, recent activity, stock alerts and chart/summary cards with coherent fixtures.
- **M01-UI05-03:** Build a reusable horizontal insight/action slider only where it serves a user goal; show position and explicit access without requiring a swipe.
- **M01-UI05-04:** Wire every tab/dashboard action to its intended static screen; retain tab state, safe areas and accessible selected/focus states.

Acceptance: All five tabs and Home actions work locally; dashboard totals/scenarios agree with shared fixture records.

### M01-UI06 — Catalog, products and reusable browsing UI

Goal: Deliver a complete product browsing and editing experience.

- **M01-UI06-01:** Build search, filter chips, category selection, sort/filter sheet and paginated-looking local list through a real reusable list pattern.
- **M01-UI06-02:** Build product/variant details, image fallback/gallery slider, price/stock sections and create/edit/archive confirmation screens.
- **M01-UI06-03:** Build category/brand/unit management from the shared row/form/sheet patterns; keep data definitions in staticData.
- **M01-UI06-04:** Handle empty catalog, no results, long names, missing images, unavailable variant and limited-permission scenarios; preserve scroll/filters on return.

Acceptance: A user can browse → detail → local edit/review → return with consistent state and no dead actions.

### M01-UI07 — Sell tab, cart, checkout and receipt UI

Goal: Prototype the central cashier journey end to end.

- **M01-UI07-01:** Build fast product/variant selection, quantity controls, customer picker, cart badge and reusable sale-line component.
- **M01-UI07-02:** Build cart editing, discount/tax display, draft handling and checkout review with clearly simulated totals matching fixture money semantics.
- **M01-UI07-03:** Build payment-method selection, partial-payment/due states, receipt, sale details, return/refund/void review and unknown-result/conflict presentation.
- **M01-UI07-04:** Use local feature state for coherent edits and reset; provide press/add-to-cart feedback and sheet transitions without suggesting a real charge or completed server sale.

Acceptance: Static sale → cart → review → demo receipt → return is complete; repeated taps and Back do not corrupt the local draft.

### M01-UI08 — Inventory tab and stock workflows UI

Goal: Make stock visibility and correction understandable.

- **M01-UI08-01:** Build stock list, low-stock filters, branch context, quantity/unit presentation and product/stock detail links.
- **M01-UI08-02:** Build ledger/history with source record navigation and reusable transaction timeline rows.
- **M01-UI08-03:** Build adjustment count/reason/review/outcome screens and simulated insufficient-stock/version conflict states.
- **M01-UI08-04:** Design transfer list/create/detail/receive/cancel states for the planned later capability; label capability scope and reuse selection/review patterns.

Acceptance: Stock list → ledger/source → adjustment review works; all mutation outcomes are visibly local demonstrations.

### M01-UI09 — Activity tab and purchase workflows UI

Goal: Provide transaction discovery and supplier purchasing flows.

- **M01-UI09-01:** Build Activity grouped timeline, type/status/date filters, search and authorized-category fixture scenarios.
- **M01-UI09-02:** Build purchase list, supplier/product selection, cost/quantity editor, receipt review and purchase details.
- **M01-UI09-03:** Build purchase return, outstanding supplier payment and conflict/error/success demonstration states.
- **M01-UI09-04:** Reuse transaction row, money summary, filter, quantity and confirmation patterns; ensure source links retain their originating filter context.

Acceptance: Activity opens the correct sale/purchase/payment/expense detail; purchase and return demos reconcile to fixture scenarios.

### M01-UI10 — Customers and suppliers UI

Goal: Create reusable business relationship screens.

- **M01-UI10-01:** Build customer and supplier lists, searches, detail summaries, create/edit and archive confirmations.
- **M01-UI10-02:** Design contact actions, transaction histories and receivable/payable summaries with distinct permission and empty states.
- **M01-UI10-03:** Reuse contact forms, relation picker, summary cards and history hooks while keeping customer/supplier business differences explicit.
- **M01-UI10-04:** Provide long labels, missing optional fields, duplicate/contact validation and local changes scenarios; do not fake phone/email external actions.

Acceptance: Both contact modules share patterns and support list → detail → edit → history without copy-pasted screen bodies.

### M01-UI11 — Expenses, reports and financial presentation UI

Goal: Present business amounts and trends clearly.

- **M01-UI11-01:** Build expense list/create/edit/detail, date/category filters and receipt attachment placeholders without fake uploads.
- **M01-UI11-02:** Build report directory and sales/profit/inventory/expense/balance report views with clear scope/date/timezone/currency.
- **M01-UI11-03:** Use reusable amount/date/filter/legend/chart-summary patterns; provide accessible text equivalents and no-data/limited-access/error states.
- **M01-UI11-04:** Create coherent report fixtures and export/job preview states; distinguish simulated presentation totals from future server financial authority.

Acceptance: Reports and expense screens are fully explorable with readable charts/tables, consistent amounts and accessible alternatives.

### M01-UI12 — More tab and business settings UI

Goal: Make management screens discoverable and consistent.

- **M01-UI12-01:** Build More directory and grouped settings landing with account, business, operations and device sections.
- **M01-UI12-02:** Build business profile, branches, team/invites/member permission summary and catalog/sales policy settings.
- **M01-UI12-03:** Build preferences, notification preferences, local data controls and subscription/usage/limit displays using shared settings rows and form sections.
- **M01-UI12-04:** Wire simulated save/cancel/reload and guarded/disabled states; expose only supported appearance/language options and no pretend billing or destructive live operation.

Acceptance: Every settings item reaches a designed screen or explicit unavailable state; local changes are consistent and clearly scoped.

### M01-UI13 — Profile, security and account UI

Goal: Finish account self-service and session presentation.

- **M01-UI13-01:** Build profile overview/edit with reusable avatar, identity fields and validation patterns.
- **M01-UI13-02:** Build security/change-password/reauthentication views and session/device list with local revoke scenarios.
- **M01-UI13-03:** Design demo sign-out, switch business, no-membership account access and pending-draft warning interactions.
- **M01-UI13-04:** Build help/about/privacy/terms/contact screens using genuine supplied content or explicit content-pending states; do not invent legal promises or support details.

Acceptance: Account flows work locally, respect accessibility and never present a local action as real authentication/session revocation.

### M01-UI14 — Supporting screens, sliders and edge-state coverage

Goal: Complete cross-app experiences and edge cases.

- **M01-UI14-01:** Build notification list/detail/deep-link preview, sync queue/conflict views and offline/stale banners from static scenarios.
- **M01-UI14-02:** Build barcode manual/scanner-permission preview, private-file/export status and attachment previews as scoped design states.
- **M01-UI14-03:** Audit all sliders/carousels, sheets, dialogs, menus and pickers for gesture conflicts, accessible controls and empty/single/multiple item behavior.
- **M01-UI14-04:** Complete not-found, forbidden, deleted record, timeout, empty/no-results, maintenance/update and permission-denied designs where relevant; no unresolved dead navigation.

Acceptance: The screen registry has a fixture scenario for every relevant state; supporting flows have explicit return destinations.

### M01-UI15 — Animation, transitions and interaction smoothness

Goal: Polish motion across already functional static workflows.

- **M01-UI15-01:** Apply shared motion tokens/primitives to stack transitions, tabs, sheets, buttons, fields, cards, sliders and feedback; eliminate one-off competing presets.
- **M01-UI15-02:** Coordinate route/sheet/keyboard/list transitions, cancel interrupted animation work and preserve state during rapid taps, swipe-back and tab switching.
- **M01-UI15-03:** Honor reduced motion and screen-reader focus; no auto-playing information slider without pause/control, and no animation required to understand status.
- **M01-UI15-04:** Profile representative release-like static flows on Android/iOS; fix dropped frames, image/layout shifts, nested scroll problems and excessive rerenders with recorded evidence.

Acceptance: Motion is consistent and interruptible; reduced-motion flows remain complete; device evidence identifies and resolves noticeable jank.

### M01-UI16 — Static UI/UX quality gate and dynamic handoff

Goal: Verify the complete static experience before server integration.

- **M01-UI16-01:** Audit every route/tab/settings link against the screen registry, scenario matrix and critical user journeys; record screenshots/video and unresolved visual gaps.
- **M01-UI16-02:** Verify Android/iOS keyboard/insets/Back/gestures, large text, contrast, TalkBack/VoiceOver, reduced motion and representative long lists.
- **M01-UI16-03:** Audit DRY boundaries, reusable components/features/hooks, staticData ownership, fixture relations and absence of network/production side effects.
- **M01-UI16-04:** Run lint/typecheck and meaningful navigation/state checks; record per-screen UI verification and a presentation-model-to-future-contract handoff without claiming API readiness.

Acceptance: All required static phases have recorded evidence; fixture UI is coherent and maintainable; remaining exclusions are explicit before dynamic work begins.

## Per-screen production-quality design checklist

A static screen can be marked **UI verified** only with route, fixture/scenario, shared components/hooks, screenshots or video, platform/build evidence and known gaps recorded. It is not **API integrated** or **production ready** merely because it looks complete.

- Primary user goal, hierarchy, readable copy, consistent spacing and reachable action.
- Meaningful static interactions; no unexplained dead button or decorative fake success.
- Relevant happy/empty/loading/error/offline/forbidden/validation/confirmation states.
- Deterministic relationships, correctly formatted sample amounts/dates/units and clearly simulated financial outcomes.
- Small/tall phone layout, safe areas, keyboard/focus, large text, screen-reader labels/roles and reduced motion.
- Stable list/slider behavior, predictable Back/gesture dismissal and preserved local draft/filter state.
- Reuse audit: existing component/pattern/hook used, or a documented reason for a new abstraction.
- Lint/typecheck and meaningful interaction/state checks passed; evidence and limitations in the tracker.

## Transition to dynamic implementation

After M01-UI16, retain static screenshots/scenarios as the visual regression baseline. Resume the preserved M01–M12 integration roadmap in dependency order: environment/security/session, organizations/permissions, domain APIs, real sync and production release. UI-complete modules do not need their screens rebuilt; replace adapters and prove real contracts, financial invariants, storage, security and lifecycle behavior.

When the server is incomplete, record the integration dependency and preserve the verified static experience. Never turn missing API responses into a hidden mock success. Release gates in the original progress tracker remain in force; fixture-only success does not satisfy them.

## Project-local UI/UX skills installed — 2026-10-16

The earlier statement that no dedicated UI/UX skill was available is retained as historical evidence. Seven reviewed skills are now installed under `.agents/skills/`: `ui-ux-pro-max`, `expo-design-system`, `expo-native-ui`, `expo-ui`, `expo-router`, `expo-animation`, and `react-native-skills` (Vercel skill name `vercel-react-native-skills`). See [the shared usage guide](../.agents/README.md) and [pinned source manifest](../.agents/skills-lock.json).

Installation is project-local; `.claude/skills`, `.gemini/skills`, and `.agent/skills` point to the same canonical files. `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` direct agents to the shared guidance. NativeWind/theme conventions, static-first order, centralized fixtures, DRY, readable contrast and reduced-motion/device checks take precedence over conflicting generic examples. No screen-design task is marked complete by installing these skills.

Installation verification: all seven skill manifests/file hashes and three project-relative discovery links passed; local design-system, contrast and React Native animation searches returned results. Typecheck passed. Lint passed with the two existing useInfiniteScroll warnings. CLI discovery has not been exercised in every third-party agent; reload sessions or read the shared guide explicitly.
