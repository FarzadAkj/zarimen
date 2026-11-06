# Progress Ledger

The cross-session memory. Read at the start of every session; update at the end of every step.

## Status

| #   | Step                                   | Status |
| --- | -------------------------------------- | ------ |
| 1   | Project structure (monorepo scaffold)  | done   |
| 1b  | Rename jewel-verify → zar-imen         | done   |

## Step log

### Step 1 — Project structure (2026-11-06)

Asked for: only the project structure. Repo shape like `../content-foundry`, code
style like Darik `../backend` and `../frontend`.

Built:
- Root: pnpm workspaces + Turborepo (`dev`, `build`, `typecheck`, `lint`, `test`, `verify`).
- `apps/backend`: NestJS + Fastify skeleton with Darik's typed `Config`, `ConfigModule`,
  error system (`defineErrorList`, `GlobalError`, `ErrorExceptionFilter`), `PrismaService`
  with `findManyAndCount` / `exists` extensions, swagger + validation bootstrap,
  consola logger. Prisma schema has only generator + datasource. `src/modules/` is empty.
- `apps/frontend`: Next.js 16 + Tailwind 4 + shadcn config (`components.json`, ui → `components/shad`),
  RTL root layout with Vazirmatn (copied from Darik), placeholder home page,
  `scripts/generate-api.ts` for the swagger client.
- `packages/shared`: empty, TypeScript-source package wired into both apps.
- `pnpm verify` green.

### Step 1b — Rename (2026-11-06)

Renamed project `jewel-verify` → `zar-imen`: folder, packages `@zar-imen/*`,
`SoftwareName` "Zar Imen", DB `zar_imen`. Clean reinstall, `pnpm verify` green.

### Step 1c — Fix `pnpm dev` (2026-11-06)

Backend exited 1 with no message. Cause: Swagger UI on Fastify needs `@fastify/static`
(Darik has it; the scaffold missed it). Added `@fastify/static`. Nest logger changed
from `false` (Darik) to `["error", "warn"]`, because `false` hid the startup error.
Verified live: backend listens on :8010, `/api` and `/api-docs` return 200, 404s go
through `ErrorExceptionFilter`; frontend serves on :3010.

## Decisions

- **Name** `zar-imen`, packages `@zar-imen/*`. Folder: `darik/zar-imen`.
- **pnpm 8.4** (the one installed). `.npmrc` sets `resolution-mode=highest`, because
  pnpm 8.0–8.6 defaults to `lowest-direct` and installed Tailwind 4.0.0, which broke the
  Next build (`Missing field negated on ScannerOptions.sources`).
- Tailwind + `@tailwindcss/postcss` pinned `^4.3.4`; they must be the same version.
- **Vitest instead of Darik's Jest**, because the backend already builds with Vite + SWC.
- `packages/shared` ships **TS source, no build** (content-foundry had a CommonJS build
  that the frontend could not consume, so it ended up aliasing to source anyway).
- **Ports:** backend 8010, frontend 3010, so they do not clash with Darik (8000 / 3000).
- Prisma 7 config uses `env("DATABASE_CONNECTION_URL")` from `prisma/config`.

## Open items

- `apps/backend/.env` has a placeholder DB URL (`postgres:postgres@.../zar_imen`),
  but the local password is different. Create the `zar_imen` database and fix the URL.
- No git repo initialised yet.
- All product questions in `planning/product.md` → "Open questions".
