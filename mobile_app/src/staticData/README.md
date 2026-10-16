# Core Shop — Static Data Fixtures & Scenario System (`src/staticData/`)

This directory is the **single source of truth** for all local fixtures, demo records, and scenario presets in the Core Shop mobile application during the Static UI/UX track.

## Architecture & Principles

1. **Centralized Fixtures**: No mock arrays, test lists, or placeholder records may be declared inside `src/app/` route files. All screens consume data through `src/staticData/` typed adapters.
2. **Deterministic & Coherent**: All IDs, prices, currencies (`BDT` / `USD`), stock quantities, and timestamps are coordinated across modules. If a product with ID `prod-101` is purchased in `purchases.ts`, it exists in `catalog.ts`, has stock in `inventory.ts`, and can be sold in `sales.ts`.
3. **Preset Scenarios**: Screens can be viewed in multiple realistic states (`happy`, `empty`, `low_stock`, `error`, `offline`) through named scenarios.
4. **Clean Handoff**: When dynamic backend API integration begins in later phases, the fixture access boundary (`getStaticData()`) can be switched to real RTK Query / server contracts without changing UI component implementations.
