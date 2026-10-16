# Core Shop server

NestJS + Fastify API foundation for the Core Shop web and mobile applications. Use Node.js 24 and Yarn Classic 1.22.22. Business modules, database connectivity and authentication will be implemented in subsequent reviewed phases.

## Development

Run from this directory:

```bash
nvm use
yarn install --frozen-lockfile
cp .env.example .env.local # First setup only; preserve existing local values.
yarn start:dev
```

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"core-shop-server"}
```

The health endpoint measures process liveness only. Business routes will use `/api/v1`; none exist yet. Database readiness will be introduced with the database integration.

## Commands

| Command | Purpose |
| --- | --- |
| `yarn start:dev` | Run the API with rebuild/watch |
| `yarn start` | Build and run the development API |
| `yarn lint` | Check source/test code without modifying files |
| `yarn typecheck` | Strict application typecheck |
| `yarn test` | Compile and run environment and HTTP smoke tests |
| `yarn build` | Compile the application into `dist/` |
| `yarn check` | Lint, typecheck, tests and build |
| `yarn start:prod` | Run the compiled app in explicit production mode |

Build before `start:prod`. The production entry point is provided for later deployment; infrastructure and production integrations are not configured in this phase.

## Configuration

- `.env.local`: development configuration, ignored by Git.
- `.env.production`: production-only template, ignored by Git. Inject real credentials at deployment; none are provided.
- `.env.example`: tracked, non-secret template for new developers.
- Process environment values override file values. Production never falls back to `.env.local`; tests read neither file.
- Validated runtime values: `NODE_ENV`, `HOST`, `PORT`, `CORS_ORIGINS`.
- `DATABASE_URL` and `REDIS_URL` are reserved for future integration and unused today. No connection or schema is created.
- `CORS_ORIGINS` is a comma-separated list of exact HTTP(S) origins; production requires HTTPS. Empty disables browser cross-origin access. CORS does not authorize requests.
- A physical mobile device connects to the development computer's LAN IP, not its own `localhost`. The local template binds to `0.0.0.0` for this workflow.

## Structure and ownership

`src/common/` holds shared infrastructure. Each domain directory owns its controllers, DTOs, application/domain services and data access as those features are implemented. Controllers remain thin. Repository/query services enforce tenant scope; cross-module changes use explicit transactions/application commands. Avoid copying domain rules into web/mobile clients.

`src/health/` is implemented. `src/database/`, the domain folders, `src/jobs/`, `prisma/migrations/` and `infrastructure/` are placeholders for later phases, preserved with `.gitkeep`. There is no Prisma schema or migration yet. `test/` contains actual foundation tests and reserved integration/e2e directories. Remove placeholder files as real source is added.

The full product specification is [in the mobile project](../mobile_app/readme/project_structure.md). The local phase plan is [readme/serverProgress.md](readme/serverProgress.md); `readme/` is intentionally ignored by Git at the owner's request and is absent from fresh clones. Work proceeds one phase at a time with owner review between phases.
