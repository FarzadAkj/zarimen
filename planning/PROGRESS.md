# Progress Ledger

The cross-session memory. Read at the start of every session; update at the end of every step.

## Status

| #   | Step                                   | Status |
| --- | -------------------------------------- | ------ |
| 1   | Project structure (monorepo scaffold)  | done   |
| 1b  | Rename jewel-verify → zar-imen         | done   |
| 1c  | Fix `pnpm dev` (@fastify/static)        | done   |
| 2   | Admin SMS login + shops admin panel    | done — needs `db:push` on the user's DB |
| 2b  | Edit wallet balance + RTL table headers | done |
| 3   | Shop owner login at <sub>.zarimen.ir/panel | done |

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

### Step 2 — Admin login (SMS) + shops panel (2026-11-06)

Asked for: one admin who logs in to zarimen.ir/panel via SMS and is the only one who
can add shops and enable/disable them; copy Darik's SMS + Shahkar services.
Shop fields chosen by the user: name, brand name, subdomain, active flag, logo (Arvan
S3, `zar-imen/` folder, Darik's upload code), address, landline, owner full name /
phone / national code, and a wallet (Decimal balance; admin may set an initial amount).

Backend:
- `libs/sms-ir` (Darik's sms.ir client, OTP only; now throws on failure),
  `libs/shahkar` (copied unchanged: Shahkar + CardMatch), `libs/image-bucket`
  (Darik's SigV4 presigner, presign path only, fixed folder `zar-imen/`),
  `libs/validators` (class-validator decorators over the shared checks).
- `modules/auth`: `sendAdminOtp`, `exchangeAdminOtp` → JWT, `me`; `IsAdmin` guard (global module).
  6-digit code via `crypto.randomInt`, 2 min TTL, one usable code per phone, burnt after
  5 wrong tries, deleted if the SMS fails. Unit tests in `auth.service.test.ts`.
- `modules/shop`: `createShop` (subdomain unique, Shahkar owner check, wallet created
  in the same write), `readShops`, `setShopActive`. All admin-only.
- `modules/image-upload`: `createImageUpload` (admin-only presigned PUT).
- Prisma: `auth.prisma` (`AuthOtp`), `shop.prisma` (`Shop`, `Wallet`).

Frontend:
- `/panel/login` (phone → OTP with countdown), `/panel` (shops table with
  enable/disable switch), `/panel/shops/new` (create form, logo upload, zod + shared validators).
- `src/proxy.ts`: `/panel*` only on `ROOT_DOMAIN` (404 on shop subdomains);
  no/invalid token → `/panel/login`.
- Token in an httpOnly `token` cookie (Darik's was readable by JS; nothing here needs that).
- Shadcn components copied from Darik; sonner without next-themes. Gold primary colour.

Verified live (no DB): redirects, 404 on `setoode.localhost`, NotAdmin / validation
errors. **Not verified live:** the actual OTP login and shop creation, because the DB
could not be reached from this session.

### Step 2b — Wallet balance edit + RTL headers (2026-11-06)

- Backend: `shop/setWalletBalance` (admin-only) sets the balance to an **absolute** value
  (Darik's dialog adds/subtracts a change instead; the user asked to "change the amount").
- Frontend: pencil button in the wallet column opens `WalletBalanceDialog` (shadcn dialog
  copied from Darik, `sm:text-left` → `sm:text-start`).
- Table headers were left-aligned because Darik's `table.tsx` hard-codes `text-left`;
  now `text-start` (and `pr-0` → `pe-0`), so they follow RTL.
- When copying more shadcn components from Darik, replace physical `left/right`,
  `pl/pr`, `ml/mr` classes with logical `start/end`, `ps/pe`, `ms/me`.

### Step 3 — Shop owner login (2026-11-06)

User first switched the wallet to **whole Tomans** (`Decimal(20, 0)`, `toFixed(0)`,
`formatAmount` adds «تومان»). This step finished it: API + form validation now accept
integers only (`/^\d{1,18}$/`).

Backend:
- `auth/sendShopOtp` + `auth/exchangeShopOtp` (`{ subdomain, phoneNumber[, code] }`):
  same OTP rules as the admin (shared private `sendOtp` / `consumeOtp`). The phone must be
  the shop's `ownerPhoneNumber`, the shop must exist and be active (checked again at
  exchange). Token: `{ role: "shop", phoneNumber, shopId }`.
- `IsShopOwner` guard: valid shop token **and** the shop still active with that owner
  phone, so disabling a shop / changing its owner logs the owner out immediately.
- `shop-panel/readShopLoginInfo` (public: name, brand, logo, isActive) and
  `shop-panel/readMyShop` (IsShopOwner).
- Errors: ShopNotFound, ShopDisabled, NotShopOwner. 3 more tests (9 total).

Frontend:
- `src/lib/host.ts` `parseHost(host, ROOT_DOMAIN)` → root / shop(subdomain) / unknown (tested).
- `src/proxy.ts` now runs on every path: root host → site + admin `/panel`; shop host →
  `/` redirects to `/panel`, `/panel/*` is **rewritten** to `src/app/tenant/[subdomain]/panel/*`,
  anything else 404; unknown hosts and direct `/tenant/*` URLs → 404.
- Shop panel: `tenant/[subdomain]/panel/login` (shop name + logo; disabled shops get a
  notice instead of the form) and `(owner)/` layout + dashboard (shop name, owner, wallet).
- Shop server actions read the subdomain from the Host header, never from the client.
- `components/shared/OtpLoginCard.tsx`: one login card for admin and shop panels.
- `lib/session.ts`: host-only httpOnly `token` cookie, so admin and each shop have
  separate sessions.

Verified live: all host/redirect/404 routes, the shop login page renders the real shop
from the user's DB, guards refuse cross-panel tokens. The full OTP→token run was cut
short because the user's own `pnpm dev` held the ports.

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
- **The admin is not a DB row.** `adminPhoneNumber` in `.env` *is* the admin; the JWT
  carries `{ role: "admin", phoneNumber }` and `IsAdmin` re-checks it against the env,
  so changing the env logs the old admin out.
- **Lean auth instead of Darik's `AuthenticatorModule`** (Google/email/password/neverthrow
  not needed). OTPs live in `AuthOtp` keyed by phone, so shop owners can reuse the flow.
- Shared validators (`isValidPhoneNumber`, `isValidNationalCode`, `isValidSubdomain`,
  `RESERVED_SUBDOMAINS`) live in `packages/shared`; both apps use them.
- Reserved subdomains: www, api, panel, admin, app, mail, static, cdn.
- Wallet balance: whole **Tomans**, `Decimal(20, 0)`, sent over the API as a string.
- Optional shop fields: logo, address, landline. Everything else is required.
- `ROOT_DOMAIN` (frontend env): `zarimen.ir` in production, `localhost:3010` in dev.

## Open items

- Run `pnpm --filter @zar-imen/backend db:push` against the real DB, then try the
  OTP login (`sendSms=false` prints the code in the backend console) and add a shop.
- Fill real values in `apps/backend/.env`: `adminPhoneNumber`, `jwtSecret`, sms.ir
  key + template, api.ir token, Arvan bucket + keys.
- What moves the wallet balance — user will specify.
- Shop staff logins (only the owner phone can log in now).
- Production: the reverse proxy must forward the original `Host` header
  (nginx `proxy_set_header Host $host;`) and DNS needs a wildcard `*.zarimen.ir` record +
  wildcard TLS certificate, since routing is by Host.
- Editing a shop's details is not built (only create + enable/disable were asked for).
- No git repo initialised yet.
- All product questions in `planning/product.md` → "Open questions".
