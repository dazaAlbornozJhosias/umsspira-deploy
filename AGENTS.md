# AGENTS.md

pnpm monorepo (`apps/*`, `packages/*`): NestJS API + Next.js web + shared TS types + Supabase DB. Team docs, comments, and user-facing strings are in Spanish — keep them that way.

## Layout

- `apps/api` — NestJS 10 REST API. Entry: `src/main.ts` (port **3000 hardcoded**, CORS origin `WEB_ORIGIN` or `http://localhost:3001`). Only `MentorshipModule` is registered in `src/app.module.ts`.
- `apps/web` — Next.js 14 App Router + Tailwind. Dev/start port **3001** (`next dev -p 3001`).
- `packages/shared-types` — `@umsspira/shared-types`, consumed as **raw TS source** (`main: src/index.ts`; no build step). Export new types from `src/index.ts`.
- `supabase/` — schema in `migrations/0001_esquema_principal.sql` (all tables, Spanish snake_case: `mentor`, `egresado`, `usuario`, …). Seed is disabled in `config.toml`.
- Empty placeholder files exist as scaffolding (`apps/api/src/modules/companies/`, `.../job-postings/`, `apps/api/src/shared/lib/redis.ts`, `apps/web/src/shared/services/api-client.ts` are 0 bytes). Web features write their own fetch code (see `src/features/mentorship/services/`).

## Commands

- Run: `pnpm dev` (both apps) or `pnpm --filter api dev` / `pnpm --filter web dev`.
- CI gate (`.github/workflows/ci.yml`, on PRs to `main`, `develop`, `epic*`) runs in this order: `pnpm lint` → `pnpm test` → `pnpm build`. All three pass today; run them before pushing. (CI's `develop` trigger is stale — the integration branch is `dev`. CI uses pnpm 9 / Node 22 despite the "Node 20" step label.)
- Tests exist only in `web` (Jest via `next/jest`, jsdom + Testing Library, colocated `*.test.tsx|ts`). `pnpm test` = web tests only (`--passWithNoTests`).
- Single test: `pnpm --filter web exec jest src/features/mentorship/model/activation-conditions.test.ts`; `pnpm --filter web test:watch` for TDD.
- No typecheck script exists; types are checked only by `nest build` / `next build`.
- Lint quirk: `apps/api` uses ESLint 10 **flat config** (`eslint.config.mjs`); the adjacent `.eslintrc.cjs` is dead — edit the flat config. `apps/web` uses `next lint` with `.eslintrc.json` (`next/core-web-vitals`).

## Environment & services

- The database is **Supabase, not Docker**. `docker compose up` starts only Redis (:6379). The README claim that Docker creates the DB is stale.
- `apps/api/.env` needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service_role, never anon). `src/shared/lib/supabase.ts` is a lazy proxy: with env missing it throws on the **first DB call**, not at startup.
- `apps/web/.env.local` → `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`); restart `next dev` after changing it.
- `next.config.mjs` writes production builds to `.next-production` and dev to `.next`, so `next build` never clobbers a running dev server.

## Code gotchas

- New backend module: `apps/api/src/modules/<name>/` with `*.module.ts` + `*.controller.ts` + `*.service.ts`, then register it in `src/app.module.ts` (see `modules/mentorship/` — the only complete example).
- Auth is not implemented yet: `mentorship.controller.ts` expects `req.user.id` from a guard that doesn't exist (TODO in file); user-scoped endpoints 401 unless you wire one.
- Mentorship contract mismatch (WIP): web sends/expects `MentorState` (`isActive`) in `features/mentorship/services/mentorship-api.ts`, but the API speaks the `mentor` table row (`esta_activo`, `experiencia`, `anios_exp`) via `UpdateParticipationDto`. Check both sides before changing either.
- `tsconfig.base.json` is empty and nothing extends it; package tsconfigs are standalone. API is non-strict (`strictNullChecks`/`noImplicitAny` off); web is `strict`.
- Shared code (`packages/shared-types/`, `apps/api/src/shared/`, `apps/web/src/shared/`, root manifests) is covered by `.github/CODEOWNERS` (@SaulCr0c0 @Fabio-3 @MijaelLujan) — expect review requirements on changes there.

## Git workflow

- Conventional Commits or the commit is **rejected**: husky `commit-msg` runs commitlint; `pre-commit` runs lint-staged (`next lint --file` for web, `eslint --fix` for api). Examples: `feat(api): …`, `fix(web): …`.
- Branch names: `feat/G<grupo>-HU<n>-nombreCorto` (e.g. `feat/G1-HU2-login`), epic integration `epic*`, integration `dev`, production `main`. Small atomic commits expected.

## Docs to distrust

- `README.md` is useful for team workflow but stale in places: its Postman "modo demo" walkthrough predates the Supabase integration (the API now reads/writes real tables), and `collection/mentorship-api.postman_collection.json` can lag behind the routes in `mentorship.controller.ts`. Trust the code over the docs.
