# Zar Imen — Working Rules

Customer identity verification for jewellery sellers. Before a seller finalises an
invoice, the customer is identified by **phone number + national code (SSN) + the
bank card they pay with**.

- What the product is and what is still undecided: `planning/product.md`
- Where we are, step by step: `planning/PROGRESS.md` — **read this first every session**

The user drives the work one step at a time. Do only the step you were given.

---

## Core rules

1. **Simplicity is the default.** No abstraction until there are two real callers,
   no config option until something actually varies, no dependency where ~30 lines
   of our own code works.
2. **Never assume. Ask.** If a requirement is ambiguous, ask before building on a guess.
3. **Keep the planning files true.** At the end of every step, update
   `planning/PROGRESS.md` (status, decisions, open items). If a decision changes
   `planning/product.md`, update it in the same step.
4. **Dependencies are added when needed**, in the app that needs them
   (`apps/backend/package.json` or `apps/frontend/package.json`), never "just in case".
5. **Every step ends green:** `pnpm verify` (build + typecheck + test). Then stop and
   report. Do not commit unless the user says so.
6. **Test logic, not static data.** Validators (national-code checksum, Luhn card
   check, phone normalisation), state transitions and error paths — yes. Constants — no.

---

## Stack

| Layer     | Choice                                                                    |
| --------- | ------------------------------------------------------------------------- |
| Monorepo  | pnpm 8 workspaces + Turborepo (`.npmrc`: `resolution-mode=highest`)        |
| Backend   | NestJS 11 on Fastify, class-validator DTOs, Swagger                       |
| Database  | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`), multi-file schema         |
| Backend run | `bun --watch` in dev, Vite + SWC bundle for production                  |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, shadcn/ui       |
| API client| `swagger-typescript-api` generates `apps/frontend/src/api` from swagger   |
| Tests     | Vitest (backend uses `unplugin-swc` for decorators)                       |
| Lint      | backend: `@antfu/eslint-config` (tabs, double quotes, no semicolons); frontend: `eslint-config-next` |

The code style mirrors the Darik project (`../backend`, `../frontend`); the repo
shape mirrors `../content-foundry`. When in doubt about a pattern, look at Darik first.

## Layout

```
apps/backend
  prisma/schema/          one .prisma file per domain (schema.prisma = generator + datasource)
  prisma.config.ts        Prisma 7 config (reads DATABASE_CONNECTION_URL)
  src/main.ts             bootstrap (Fastify, validation pipe, error filter, swagger, cors)
  src/app.module.ts       registers libs + feature modules
  src/config.ts           every env var, validated at boot (class-validator)
  src/common/             constants (ModuleNames, SoftwareName), shared DTOs
  src/libs/               infrastructure: config, error, prisma, logger, helper, validators,
                          sms-ir (OTP SMS), shahkar (Shahkar + CardMatch), image-bucket (Arvan presign)
  src/modules/<feature>/  Darik module layout:
                            <feature>.module.ts / .controller.ts / .service.ts
                            constants/ (errors, selects)  dto/ (*.input.ts, *.output.ts)  model/

apps/frontend
  src/app/panel/          admin panel (zarimen.ir/panel): login/, (admin)/ guarded pages
  src/app/tenant/[subdomain]/        a shop's site, reached ONLY via the proxy rewrite:
                            page.tsx (landing), verify/ (customer verification, actions.ts),
                            panel/ (owner panel: login/, (owner)/ guarded pages, actions.ts)
  src/lib/current-shop.ts currentSubdomain() from Host + getShopPublicInfo() for shop pages
  src/proxy.ts            routes by Host (lib/host.ts parseHost); guards /panel on both hosts
  src/api/                GENERATED swagger client — never edit by hand
  src/components/shad/    shadcn/ui primitives (components.json points `ui` here)
  src/components/shared/  app-wide reusable components
  src/components/layout/  header, sidebar, shells
  src/hooks/  src/lib/    hooks; utils (cn), formatting, api wrapper

packages/shared           code BOTH apps import (validators, enums, types)
                          shipped as TypeScript source, no build step:
                          backend bundles it (vite ssr.noExternal), Next transpiles it
                          (transpilePackages)
```

Anything only one app uses lives in that app, not in `packages/shared`.

## Conventions (from Darik)

- Backend imports use the `~/` alias (`~/libs/prisma/prisma.service`); frontend uses `@/`.
- Errors: each module declares `constants/<module>.errors.ts` with
  `defineErrorList(ModuleNames.X, { SomeError: { statusCode } })` and throws via
  `ErrorService.throwErrorToClient(...)`. `ErrorExceptionFilter` shapes every response.
- Add a new module name to `ModuleNames` in `src/common/constants.ts`.
- Prisma client has `findManyAndCount` and `exists` extensions on every model.
- Use `type`, not `interface` (lint rule `ts/consistent-type-definitions`).
- UI language is Persian, layout is RTL (`<html lang="fa" dir="rtl">`), font Vazirmatn.
- Sensitive data (national code, card number) must never be logged in full.
- Admin-only endpoints: `@UseGuards(IsAdmin)`; shop-owner endpoints: `@UseGuards(IsShopOwner)`
  (reads `request._shopOwner.shopId`). Both in `modules/auth/guards/`. Shop-owner
  endpoints live under the `shop-panel` controller and must only touch the token's shop.
- Shop pages and actions get the subdomain from the Host header (`currentSubdomain()` in
  `lib/current-shop.ts`), never from a client argument.
- Frontend talks to the backend only from server actions (`takeApi()` reads the
  httpOnly `token` cookie), each returning `ServerResponse<T>` with a Persian
  `error.translation` from `src/lib/errors.ts` — add every new backend error code there.
- Customer endpoints: `@UseGuards(IsCustomer)` (`modules/customer/guards`); the frontend
  calls them with `takeApi(CUSTOMER_TOKEN_COOKIE)`.
- SMS codes always go through `OtpService` (`modules/auth/otp.service.ts`); pass
  `billToShopId` when a shop's customer triggers it.
- Anything a shop's customers trigger that costs money goes through
  `WalletService.charge(shopId, service, run)` — never call Shahkar/CardMatch/SMS for a
  customer without it.
- Admin settings: Darik's format — a model class with defaults in
  `modules/setting/model/`, a key in `settings-constant.keys.ts`,
  `SettingService.getSetting/setSetting`, one card per group on `/panel/settings`.
- Card numbers: masked (`maskCardNumber`) everywhere, except `readMyCustomerCards`, which
  gives a shop owner the full numbers of their own customers on request.
- Form validation reuses the `@zar-imen/shared` checks; convert Persian digits with
  `toLatinDigits` before validating.

## Commands

```
pnpm install
pnpm dev                                  # both apps (backend :8010, frontend :3010)
pnpm verify                               # build + typecheck + test — gate for every step
pnpm --filter @zar-imen/backend db:push
pnpm --filter @zar-imen/backend db:migrate
pnpm --filter @zar-imen/frontend api  # regenerate the API client (backend must be running)
```
