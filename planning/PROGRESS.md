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
| 2c  | Shop owner login at <sub>.zarimen.ir/panel | done |
| 3   | Shop landing page + big verification button | done |
| 3b  | Customer verification on /verify (3 phases) + owner's customer list | done |
| 3c  | Several admins: `adminPhoneNumbers` list | done |
| 4   | Admin settings: Shahkar + SMS cost, charged to shop wallets | done |
| 4b  | Owner's customers: debounced search, card count + full-number dialog | done |
| 4c  | Signup skips Shahkar for a saved exact match; masked phone in phase 2 | done |
| 5   | Owner wallet top-up (Zarinpal) + transaction history | done |
| 6   | Admin views a shop's panel at /panel/customers/<subdomain> | done |
| 6b  | Timer: cancel top-ups pending > 20 min, every 10 min | done |

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

### Step 2c — Shop owner login (2026-11-06)

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

### Step 3 — Shop landing page (2026-11-06)

Asked for: <subdomain>.zarimen.ir shows the shop's logo and info and a big, unmissable
button for customers to continue with verification.

- Backend: public endpoint renamed `readShopLoginInfo` → `shop-panel/readShopPublicInfo`
  and now also returns `address` and `landline` (still no owner details, no wallet).
- Frontend:
  - `tenant/[subdomain]/page.tsx`: landing page, mobile-first. Logo (or brand initial),
    name, brand, address + tappable landline, and the big gold «احراز هویت مشتری» button
    linking to `/verify`. Small «ورود فروشنده» link to `/panel` in the footer.
  - `tenant/[subdomain]/verify/page.tsx`: **placeholder** until the verification flow is built.
  - Disabled shop → `DisabledShopNotice` on landing, verify and login pages.
  - `lib/current-shop.ts`: `currentSubdomain()` (moved out of the panel actions, so it is
    not a callable server action) + `getShopPublicInfo()` (cached per request, 404 for
    unknown subdomains).
  - `proxy.ts`: shop host `/` and `/verify` are public rewrites (before: `/` redirected
    to `/panel`); everything else except `/panel/*` is 404.
- Verified live against the user's dev server and with a 412px headless-Firefox screenshot.

### Step 3b — Customer verification on /verify (2026-11-06)

Asked for: a step indicator on top and three phases. (1) national code (10 digits),
mobile ("09" pre-typed + 9 digits), Jalali birth date (Darik's PersianCalendar) → Shahkar.
(2) SMS code → customer saved, unique by national code, linked to many shops; owners see
their customers. (3) the customer's cards + add a 16-digit card → CardMatch (card +
national code + birth date) → saved. Phase 1 has a login button: mobile only → SMS →
phase 3. Signing up again with a known national code + birth date adds no row; only the
shop links change.

Backend:
- Prisma `customer.prisma`: `Customer` (ssn unique, phoneNumber, birthDate as Jalali
  "YYYY/MM/DD" string), `CustomerShop` (customer ↔ shop, createdAt + lastSeenAt),
  `CustomerCard` (unique per customer + card number). `db push` applied to the user's dev DB.
- `OtpService` extracted from AuthService (admin, shop owner and customer all use it).
- `modules/customer`: `customer/startSignup`, `completeSignup`, `startLogin`,
  `completeLogin`, `readMyCards`, `addCard` (IsCustomer); `shop-panel/readMyCustomers`
  (IsShopOwner). Bank names from Darik's `bank-prefixes.ts`.
- 15 tests in `customer.service.test.ts`.

Frontend:
- `/verify`: `VerifyFlow` (state machine) + `VerifySteps` (indicator with sliding gold
  fill and «مرحله n از ۳» banner) + `IdentityStep` / `LoginStep` / `CodeStep` / `CardsStep`,
  `PhoneInput` (fixed 09). A customer with a live session lands on phase 3.
- «پایان» ends the customer session and returns to the landing page.
- Owner panel: nav (داشبورد / مشتریان) and `/panel/customers` table (national code,
  mobile, birth date, masked cards + bank, first/last visit in Jalali).
- `PersianCalendar` copied from Darik with physical left/right → start/end, theme colours.
- Shared validators: `isValidJalaliDate`, `isValidBankCardNumber` (Luhn).

Verified live: /verify renders (412px screenshot), validation and NotRegistered /
Unauthorized responses. Not run live end to end, so as not to write test customers into
the user's DB; covered by unit tests.

### Step 3c — Admin phone list (2026-11-06)

`.env` `adminPhoneNumber` → `adminPhoneNumbers`, comma-separated ("0912...,0913...").
Validated at boot (each must be 09xxxxxxxxx). `Config.isAdminPhoneNumber(phone)` is used
by AuthService (who may get an admin code) and IsAdmin (re-checked on every request, so
removing a number logs that admin out). User's `.env` key renamed, value kept.

### Step 4 — Service costs (2026-11-06)

Asked for: an admin settings page (Darik's settings format) with two Toman prices,
Shahkar cost and SMS cost. Each Shahkar request / SMS a customer triggers on a shop's
subdomain is paid from that shop's wallet; not enough balance → the request does not run.

Backend:
- Darik's settings format: `Setting { key @id, value }` (JSON per key, `setting.prisma`),
  global `SettingService.getSetting(key, Model)` (defaults when unsaved) / `setSetting`.
  `ServiceCostSettingsModel { shahkarCost = 0, smsCost = 0 }` under
  `service-cost-settings-key`; `setting/readServiceCostSettings` + `setServiceCostSettings`
  (IsAdmin). Darik put these endpoints in its `info` module; here they sit in `setting`.
- `modules/wallet` `WalletService`:
  - `charge(shopId, "shahkar" | "sms", run)`: conditional decrement
    (`updateMany where balance >= cost`) → InsufficientBalance (402) if it matched nothing;
    refunds if `run` throws. Cost 0 → wallet untouched.
  - `assertCanAfford(shopId, services)`: sum check before multi-service flows.
- Charged: Shahkar in startSignup, CardMatch in addCard (both = "shahkar" cost), and
  customer SMS (startSignup, startLogin) via `OtpService.send(phone, billToShopId)`.
  startSignup first checks the wallet covers Shahkar + SMS.
- 13 new tests (wallet 7, customer billing 4, OTP 1, + updates).

Frontend: `/panel/settings` (nav «تنظیمات»), `settings/actions/action.ts`,
`ServiceCostSettingSection` card. Customer-facing InsufficientBalance message.

Also: frontend `.gitignore` ignored `.env.example` (Darik's `.env*` rule) → `!.env.example`.

### Step 4b — Owner's customers page: search + cards dialog (2026-11-06)

Asked for: a search box on <sub>.zarimen.ir/panel/customers matching any part of the
national code or mobile, run 1000 ms after typing stops, reloading only the table; the
table shows a card count with an eye icon that opens a modal with the full card numbers.

- Backend: `shop-panel/readMyCustomers { search? }` (digits, `contains` on ssn OR phone)
  now returns `cardCount` instead of cards; new `shop-panel/readMyCustomerCards { customerId }`
  returns full numbers + bank, only if the customer is linked to the owner's shop
  (`CustomerNotFound` otherwise). 2 new tests.
- Frontend: `CustomersBrowser` (client: debounced search, stale responses dropped, table
  dims while loading) + `CustomerCardsDialog` (fetches on open). Page loads the first list
  on the server. `formatCardNumber` moved to `lib/format.ts`.

### Step 4c — Skip Shahkar for known customers; masked phone (2026-11-06)

- `startSignup`: a customer saved with the same national code + birth date + phone is not
  sent to Shahkar again (and not charged for it); only the SMS goes out, and the wallet
  check covers just the SMS. A different phone for a saved national code still goes to
  Shahkar. 2 new tests.
- Phase 2 text: «کد ۶ رقمی به شماره 0917***4864 ارسال شده است.» via `maskPhoneNumber`
  (`lib/format.ts`, 5th–7th digits hidden; tested).

### Step 5 — Wallet top-up + history (2026-11-06)

Asked for: owners top up their wallet through Zarinpal (like Darik); a transaction history
page: increases with Jalali date/time + amount, decreases also with SMS/Shahkar + customer ssn.

Backend:
- `wallet.prisma`: `WalletTransaction` ledger (signed `amount`, type TOP_UP /
  SERVICE_CHARGE / ADMIN_ADJUSTMENT, status, service, customerSsn, Zarinpal authority /
  refId / cardPan), enums `WalletTransactionType`, `WalletTransactionStatus`, `PaidService`.
- `libs/zarinpal`: Darik's v4 client trimmed to request / verify / gateway url (no
  neverthrow/cleana/defu). Config: `zarinPalMerchantId`, `zarinpalCallbackUrl`,
  `zarinpalBaseUrl`, and `shopSiteUrl` ("http(s)://{subdomain}.…") for the redirect back.
- `WalletService`: `charge(bill {shopId, customerSsn}, service, run)` now writes the history
  row with the deduction (one DB transaction) and deletes it on refund; `startTopUp`
  (PENDING row → Zarinpal → authority), `handleTopUpCallback` (NOK → FAILED; verify 100/101 →
  PENDING→SUCCESS + credit in one transaction, conditional on still PENDING, so a repeated
  callback credits once; Zarinpal unreachable → stays PENDING), `readTransactions` (SUCCESS
  rows, newest first, 20 per page).
- Endpoints: `GET wallet/topUpCallback` (302 → <shop>/panel/wallet?topUp=…),
  `shop-panel/startWalletTopUp`, `shop-panel/readMyWalletTransactions`.
- ShopService records admin changes as ADMIN_ADJUSTMENT (initial balance; setWalletBalance
  diff, Serializable).
- Sandbox request verified live (authority returned). 7 new top-up tests, charge tests updated.

Frontend: owner nav «کیف پول» (`/panel/wallet`: balance, top-up form with quick amounts,
success / failure banner from the callback) and «تراکنش‌ها» (`/panel/transactions`,
`WalletTransactionsTable` with ?page= paging); dashboard «افزایش موجودی» button.

### Step 6 — Admin views a shop (2026-11-06)

Asked for: the admin enters a shop and sees its panel at zarimen.ir/panel/customers/<subdomain>.

- Backend (IsAdmin): `shop/readShopBySubdomain`, `shop/readShopCustomers`,
  `shop/readShopCustomerCards`, `shop/readShopWalletTransactions` — the owner endpoints'
  logic with the shopId given by the admin.
- Frontend: `/panel/customers/[subdomain]` — shop header (logo, status, owner, balance),
  the same `CustomersBrowser` (search + full-card dialog) and `WalletTransactionsTable`.
  CustomersBrowser / CustomerCardsDialog now take their loaders as props (owner actions or
  admin actions `.bind(null, shopId)`). Shop names in the admin's shops table link here.

### Step 6b — Cancel stale top-ups (2026-11-06)

`@nestjs/schedule` (as in Darik) + `ScheduleModule.forRoot()`. `WalletService.cancelStaleTopUps`
runs `@Cron(EVERY_10_MINUTES)`: TOP_UP rows still PENDING more than
`PENDING_TOP_UP_TTL_MINUTES` (20) after creation → new status `CANCELED`. A later callback
for one redirects with `reason=Expired` and credits nothing (crediting requires PENDING);
Zarinpal returns unverified payments to the payer. Owner wallet page shows an «Expired»
message. 2 new tests. Enum value pushed to the dev DB (the first `db push` wrongly said
"in sync"; confirmed with `db pull`).

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
- **Admins are not DB rows.** `adminPhoneNumbers` in `.env` (comma-separated) *are* the
  admins; the JWT carries `{ role: "admin", phoneNumber }` and `IsAdmin` re-checks it
  against the list, so removing a number logs that admin out.
- **Lean auth instead of Darik's `AuthenticatorModule`** (Google/email/password/neverthrow
  not needed). OTPs live in `AuthOtp` keyed by phone, so shop owners can reuse the flow.
- Shared validators (`isValidPhoneNumber`, `isValidNationalCode`, `isValidSubdomain`,
  `RESERVED_SUBDOMAINS`) live in `packages/shared`; both apps use them.
- Reserved subdomains: www, api, panel, admin, app, mail, static, cdn.
- Wallet balance: whole **Tomans**, `Decimal(20, 0)`, sent over the API as a string.
- Optional shop fields: logo, address, landline. Everything else is required.
- **Phase 1 → 2 is a signed ticket**, not server state: startSignup returns a JWT
  (`kind: "customer-signup"`, ssn, phone, birth date, shopId, 10 min) and completeSignup
  needs it + the SMS code, so the details cannot be swapped after Shahkar passed.
- **Customer session**: separate `customer_token` cookie (30 min), because customers use
  the shop's device where the owner may be logged in. Token `{ role: "customer", customerId, shopId }`.
- Known national code with a **different birth date** → `BirthDateMismatch` (no update).
  Same birth date → no new row; phone updated to the newly verified one; shop linked.
- **Login also links** the customer to the shop they log in at (so the owner sees them).
- Customer phone is **not unique** (a number can move to another person); login uses the
  most recently updated customer with that phone.
- **Card numbers are stored in full.** Customers see their own cards masked
  ("6037-99**-****-7893"). Shop owners see a count in lists and the full numbers only on
  request (eye icon → `readMyCustomerCards`), for their own customers only.
- Shop owners see customers' full national code, mobile and birth date.
- **What is billed**: only what a shop's *customers* trigger (Shahkar, CardMatch, customer
  SMS). Not billed: the owner's own panel login SMS (an empty wallet must not lock the owner
  out), admin login, and the admin's Shahkar check when adding a shop.
- **Shahkar "no match" is billed** (the check ran); provider errors / timeouts are refunded.
- Charges also apply with `identityCheck=false` / `sendSms=false` (same behaviour in dev
  and production, so billing can be tested locally).
- **The wallet history is a ledger**: every balance change writes a WalletTransaction in the
  same DB transaction (charges, top-ups, admin changes incl. the initial balance), so the
  history adds up to the balance. Refunded charges are deleted, not shown.
- **Top-ups are not restricted to a card** (Darik restricts to the payer's verified card;
  shop owners have no verified cards). Min 2,000, max 200,000,000 Tomans.
- `ROOT_DOMAIN` (frontend env): `zarimen.ir` in production, `localhost:3010` in dev.

## Open items

- Run `pnpm --filter @zar-imen/backend db:push` against the real DB, then try the
  OTP login (`sendSms=false` prints the code in the backend console) and add a shop.
- Fill real values in `apps/backend/.env`: `adminPhoneNumbers`, `jwtSecret`, sms.ir
  key + template, api.ir token, Arvan bucket + keys.
- Zarinpal: production `zarinPalMerchantId`, `zarinpalCallbackUrl` (public backend url) and
  empty `zarinpalBaseUrl` must be set; `shopSiteUrl = https://{subdomain}.zarimen.ir`.
- Rate limiting: each startSignup costs one paid Shahkar call and addCard one CardMatch
  call; nothing limits how often a visitor can trigger them yet.
- Customers cannot remove a card; the owner's customer list is not paginated yet.
- Full card numbers at rest: consider encrypting the column.
- Shop staff logins (only the owner phone can log in now).
- Production: the reverse proxy must forward the original `Host` header
  (nginx `proxy_set_header Host $host;`) and DNS needs a wildcard `*.zarimen.ir` record +
  wildcard TLS certificate, since routing is by Host.
- Editing a shop's details is not built (only create + enable/disable were asked for).
- No git repo initialised yet.
- All product questions in `planning/product.md` → "Open questions".
