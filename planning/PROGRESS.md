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
| 7   | Subscription plans (admin) + purchases via Zarinpal (owners) | done |
| 7b  | Admin moves a shop's end date (later only); no subscription → no customer data | done |
| 7c  | Owner dashboard shows Shahkar / SMS prices | done |
| 7d  | Separate price for bank card checks (CardMatch) | done |
| 8   | zarimen.ir landing page (+ /blog placeholder, contact links) | done — contacts pending |
| 9   | Support tickets (owner ↔ admins) + SMS notice to admins | done |
| 10  | Public shop requests (/signup) → admin "Check and Insert" | done |

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
  `PhoneInput` (customer types the full 09… number; was a fixed 09 prefix until 2026-11-08). A customer with a live session lands on phase 3.
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

### Step 7 — Subscriptions (2026-11-06)

Asked for: admin defines plans (price + length) on the settings page; a shop must be
subscribed to use the service; owners buy plans; a new purchase is added to the end of the
running subscription; owners see current plan + due date on the dashboard and their purchase
history (amount paid); admin sees each shop's due date in the shops table; all dates Jalali.
User chose: **pay directly via Zarinpal**; **without a subscription customers are blocked, the
owner panel stays open**.

Backend:
- `subscription.prisma`: `SubscriptionPlan` (title, price, durationDays, isActive — disabled,
  never deleted), `SubscriptionPurchase` (snapshot of title/price/days, status
  PENDING/SUCCESS/FAILED/CANCELED, startsAt/endsAt, Zarinpal fields); `Shop.subscriptionEndsAt`.
- `modules/subscription`: `extendSubscription(currentEnd, now, days)` (start = max(now,
  current end)) and `hasActiveSubscription` (tested). Admin: `setting/readSubscriptionPlans`,
  `createSubscriptionPlan`, `setSubscriptionPlanActive`. Owner: `shop-panel/readAvailablePlans`,
  `readMySubscription` (isActive, endsAt, title of the purchase covering today),
  `readMySubscriptionPurchases`, `startSubscriptionPurchase`. `GET subscription/purchaseCallback`
  → 302 <shop>/panel/subscription?purchase=…. Completion: PENDING→SUCCESS conditional +
  `SELECT … FOR UPDATE` on the shop row before extending. `cancelStalePurchases` cron (10 min / 20 min).
- Config: `zarinpalCallbackUrl` → **`backendUrl`**; each payment kind builds its own callback
  (`/wallet/topUpCallback`, `/subscription/purchaseCallback`). ZarinpalService takes `callbackUrl` per request.
- Customers blocked: `CustomerService.findActiveShop` → `SubscriptionInactive` (403) before
  any paid call. `ShopPublicInfoModel.hasActiveSubscription`, `ShopModel.subscriptionEndsAt`.
- Tests: 4 for the date rules, 6 purchase-flow, 1 customer blocking.

Frontend:
- Admin `/panel/settings`: «طرح‌های اشتراک» card (list + enable switch + add form with
  duration presets, 1 month = 30 days). Shops table «پایان اشتراک» column and admin shop page
  header (`SubscriptionStatus`: Jalali date + days left / «منقضی» / «ندارد»).
- Owner: nav «اشتراک» → `/panel/subscription` (current status, plans with «خرید با
  زرین‌پال», result banner, purchase history: plan, amount paid, Jalali purchase date, period);
  dashboard subscription card («خرید / تمدید اشتراک»).
- Customers: landing + /verify show «موقتاً در دسترس نیست» when not subscribed.
- `formatDate`, `daysUntil` (Jalali via fa-IR); `formatDuration`, `DURATION_PRESETS` in lib/format.

### Step 7b — Admin end date + customer data needs a subscription (2026-11-06)

- `shop/setShopSubscriptionEnd { shopId, endsAt }` (IsAdmin): `adminExtension` refuses
  `endsAt` ≤ max(current end, now) → `EndDateTooEarly`; otherwise sets the date under the same
  `FOR UPDATE` lock as purchases and writes a SUCCESS history row «تمدید توسط مدیر», price 0,
  startsAt = old end (or now). `SubscriptionPurchase.planId` is now optional for these rows.
- `HasActiveSubscription` guard (after IsShopOwner) on `shop-panel/readMyCustomers` and
  `readMyCustomerCards` → `SubscriptionInactive`. Admin endpoints unaffected.
- Frontend: `SubscriptionEndDialog` (PersianCalendar, Jalali → end of that day in the
  browser's Iran time) next to the end date in the shops table and the admin shop page;
  owner customers page shows «اشتراک فعال لازم است» + «خرید اشتراک» instead of the table.
- 6 new tests (adminExtension rules, service: records the row / refuses early dates).

### Note — "Argument shop is missing" (2026-11-07)

User hit it on `setShopSubscriptionEnd`. Cause: the running `bun --watch` backend still had the
Prisma client from before `planId` became optional (so Prisma fell back to the relation-style
create input, which needs `shop`). The same create works in a fresh process. Fix: restart
`pnpm dev` after every `prisma generate`. Noted in CLAUDE.md.

### Step 7c — Service prices on the owner dashboard (2026-11-07)

`shop-panel/readServiceCosts` (IsShopOwner, read only; `ShopServiceCostController` in the
setting module). Dashboard `ServiceCostsCard`: price per Shahkar check and per SMS («رایگان»
when 0) and what each customer action costs (new signup = Shahkar + SMS; repeat signup /
login = SMS; each card = Shahkar).

### Step 7d — Card check has its own price (2026-11-07)

`ServiceCostSettingsModel.cardMatchCost` (default 0) next to `shahkarCost` (now only mobile ↔
national code) and `smsCost`. `PaidService.CARD_MATCH`; `CustomerService.verify` takes the
service, `addCard` bills CARD_MATCH. Admin settings has a third field, the owner's prices card
shows it, history labels it «استعلام کارت بانکی». Card checks charged before this stay recorded
as SHAHKAR. 1 new customer test, wallet test covers the third price.
Generating the API client from the user's running (stale-client) backend dropped CARD_MATCH;
regenerated from a fresh temporary backend on :8011.

### Step 8 — zarimen.ir landing page (2026-11-07)

Asked for: a landing page with the (later-provided) logo, what Zar Imen is and does, what
shop owners get, a route to the blog, the subscription plans at the end, and a way to contact
the user to buy. User chose: **direct contact links only** (no form).

- Backend: public `subscription/readPublicPlans` (active plans, no login).
- Frontend `src/app/page.tsx` (root host): sticky header (logo, anchors, «تماس برای خرید»),
  hero, «چطور کار می‌کند» (3 steps), «با زر ایمن چه به دست می‌آورید» (8 benefits), blog
  teaser → `/blog`, plans (live, `revalidate = 300`, `publicApi()` without cookies), contact.
- `components/site/SiteLogo.tsx`: logo image (`LogoMark`) + «زر ایمن» — see "Logo" below.
- `components/site/ContactLinks.tsx`: `CONTACT_PHONE` (tel:), `CONTACT_WHATSAPP` (wa.me),
  `CONTACT_TELEGRAM` (t.me) from apps/frontend/.env; empty ones hidden.
- `/blog`: placeholder page until the blog is specified.
- Checked with desktop + mobile headless-Firefox screenshots.

### Step 8b — Landing page polish (2026-11-07)

Body paragraphs `text-justify` (centered intros keep a centered last line via
`[text-align-last:center]`). Smooth in-page scrolling: `html { scroll-behavior: smooth }` in
globals.css (off with prefers-reduced-motion) + `data-scroll-behavior="smooth"` on <html> (Next 16
needs it so route changes still jump to the top instantly).

### Step 8c — Service prices on the landing page (2026-11-07)

Public `setting/readPublicServiceCosts` (own unguarded controller; the admin `setting`
controller stays IsAdmin). Landing page section «هزینه خدمات» right after the plans: one card
per service whose price is above 0 (Shahkar, card check, SMS), «… تومان / هر بار»; the whole
section is left out when all are free or the backend is unreachable. (User adjusted the grid to
`sm:grid-cols-2` themselves.)

### Step 8d — 7-day trial highlight (2026-11-07)

Landing page plans section: a full-width highlighted card «۷ روز آزمایش رایگان» (gift icon,
«رایگان» badge, «درخواست دوره آزمایشی» → #contact) above the plan cards; shown even with no
active plans. User chose **highlight only**: there is no automatic trial — the admin grants the
7 days with the subscription end-date pencil when creating a shop. The text says Shahkar /
card / SMS charges still come from the wallet during the trial (true: charging is independent
of the subscription).

### Deployment guide (2026-11-07)

`docs/DEPLOY.md`: Ubuntu + Node 22 + pnpm 8.4 (corepack) + PostgreSQL + PM2 + nginx; DNS
(A for @, www, api, *), production .env values, `db:push`, `pnpm build`, PM2, wildcard TLS via
DNS-01 (acme.sh dns_arvan or certbot manual), nginx (api → :8010; root, www, *.zarimen.ir →
:3010 with `Host` passed), Zarinpal / sms.ir / api.ir / Arvan bucket CORS, smoke test,
updating, pg_dump backups, troubleshooting. Build happens on the server (the backend bundle
needs node_modules), unlike Darik's scp-the-dist script.
- Backend `start` now `node --env-file=.env …` — it did not load .env before (production would
  have started with no config). Verified: Node 22 parses our `key = value` .env, and the built
  `dist/main.js` runs under plain Node (Bun only for dev).
- `ecosystem.config.cjs` (PM2): one backend instance (the @Cron jobs live in it) + frontend.

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
- **Plan length is in days** (1 month = 30 days), so "1 month + 2 weeks" is exact.
- **A purchase extends from max(now, current end)**, computed when Zarinpal verifies it.
- `ROOT_DOMAIN` (frontend env): `zarimen.ir` in production, `localhost:3010` in dev.

## Open items

- Run `pnpm --filter @zar-imen/backend db:push` against the real DB, then try the
  OTP login (`sendSms=false` prints the code in the backend console) and add a shop.
- Fill real values in `apps/backend/.env`: `adminPhoneNumbers`, `jwtSecret`, sms.ir
  key + template, api.ir token, Arvan bucket + keys.
- Zarinpal: production `zarinPalMerchantId`, `backendUrl` (public backend url) and
  empty `zarinpalBaseUrl` must be set; `shopSiteUrl = https://{subdomain}.zarimen.ir`.
- Existing shops have no subscription → their customers are blocked until they buy one.
  The admin can give one by setting an end date (shops table pencil). The landing page
  advertises a 7-day trial, granted the same way (manually) — nothing automatic.
- Rate limiting: each startSignup costs one paid Shahkar call and addCard one CardMatch
  call; nothing limits how often a visitor can trigger them yet.
- Customers cannot remove a card; the owner's customer list is not paginated yet.
- Full card numbers at rest: consider encrypting the column.
- Shop staff logins (only the owner phone can log in now).
- OTP codes are always printed to the backend console (even with `sendSms=true`), so they
  also end up in the PM2 logs in production. Decide whether to keep that before launch.
- Landing page: the blog.
- Production: the reverse proxy must forward the original `Host` header
  (nginx `proxy_set_header Host $host;`) and DNS needs a wildcard `*.zarimen.ir` record +
  wildcard TLS certificate, since routing is by Host.
- Editing a shop's details is not built (only create + enable/disable were asked for).
- No git repo initialised yet.
- All product questions in `planning/product.md` → "Open questions".

## Logo (2026-11-08)

- Logo file: `apps/frontend/public/images/logo.png` (white background, portrait).
- `components/site/SiteLogo.tsx`: `LogoMark` (the image, `mix-blend-multiply` hides the white
  background) replaces the lucide `Gem` placeholder in `SiteLogo` (header, footer, /blog);
  the landing hero shows it big.
- Favicon: `src/app/icon.png` (transparent, square) and `src/app/apple-icon.png` (white bg),
  generated from the logo. If the logo changes, regenerate them.
- `proxy.ts` matcher skips `images/`, `icon.png`, `apple-icon.png` so they also load on shop subdomains.

## Deploy fixes + enamad (2026-11-08)

- `NEXT_PUBLIC_SERVER_ADDRESS` must have no trailing slash (it caused `//auth/...` 404s on the
  server); noted in `docs/DEPLOY.md`.
- `turbo.json` build inputs include `.env*`, so an env change is no longer a cache hit.
- Plan / service-price admin actions also `revalidatePath("/")` (the landing page lists them).
- enamad trust seal (id 8594365) in the landing page footer + `enamad` meta tag, same markup as
  Darik's footer. Plain `<img>` on purpose (enamad checks the referrer).
- Site-ownership file `zarimen.ir/75213451.txt` is served by nginx from `/var/www/zarimen-verify`
  (server-only, not in the repo).

## Owner details on the shop landing page (2026-11-08)

- The user chose to show the owner's **full name** and **mobile number** (full, tappable `tel:`)
  on <subdomain>.zarimen.ir. The national code stays private.
- `ShopPublicInfoModel` / `readShopPublicInfo` now also return `ownerFullName` and
  `ownerPhoneNumber`. They are public, so the login page and `/verify` receive them too.
  `Api.d.ts` was edited by hand. Run `pnpm api` against a running backend to regenerate it.
- Landing info card: «مدیر فروشگاه: …», mobile, landline, address (always shown now, since
  the owner fields are required).

### Step 9 — Support tickets (2026-11-08)

Asked for: owners open tickets (title + body, up to 2 photos per message); statuses PENDING /
ANSWERED / CLOSED; only the owner closes; nobody writes in a CLOSED ticket; admins get a bulk
SMS «تیکتی با موضوع ${title} ارسال شده است.» like Darik's `sendPurchasedNotifyMessage`.
User's answers: an owner message on an ANSWERED ticket puts it back to PENDING; the SMS goes
on **every** owner message (opening included); the new .env key is the sms.ir sender line;
admins may attach photos too.

Backend:
- `prisma/schema/ticket.prisma`: `Ticket` (shopId, title, status, updatedAt bumped by every
  message), `TicketMessage` (fromAdmin, body, `imageUrls String[]`), enum `TicketStatus`.
  `db push` applied to the dev DB.
- Config `smsIrLineNumber` (digits) in `.env` / `.env.example`, next to `smsIrOtpTemplate`;
  `Config.adminPhoneNumberList()`. `SmsIrService.sendBulkMessage(mobiles, text)`: never throws,
  logs the text, sends nothing with `sendSms=false`.
- `modules/ticket`: admin (`ticket/readTickets` with optional status, `readTicket`,
  `answerTicket` → ANSWERED) and owner (`shop-panel/createTicket`, `readMyTickets`,
  `readMyTicket`, `sendMyTicketMessage` → PENDING + SMS, `closeMyTicket`). Owners only reach
  their own shop's tickets (others → TicketNotFound). Writing is a conditional update on
  "not CLOSED", so a close that lands at the same moment wins (TicketClosed).
- Image URLs must be in our bucket's `zar-imen/` folder (`ImageBucketService.isOwnImageUrl`,
  else InvalidTicketImage); at most 2 (DTO). Owners sign uploads via `shop-panel/createMyImageUpload`.
- 7 tests in `ticket.service.test.ts`.

Frontend:
- `lib/upload-image.ts` now takes the signing action (admin's or owner's).
- Owner: nav «پشتیبانی», `/panel/tickets` (list), `/panel/tickets/new`, `/panel/tickets/<id>`
  (thread, reply, «بستن تیکت» with a confirm).
- Admin: nav «تیکت‌ها», `/panel/tickets` (status filter chips), `/panel/tickets/<id>`.
- `components/ticket/*` shared by both sides; `components/shad/textarea.tsx` added.
- `src/api` regenerated with `pnpm api` (this also replaced the hand-edited ShopPublicInfoModel).

### Step 10 — Public shop requests instead of contact details (2026-11-08)

Asked for: no admin contact details on zarimen.ir; a separate page where anyone fills the
admin's own shop form (one shared component); saved in a `tobe-shop` table (not Shop);
admins texted (bulk, like tickets) and see the requests in the panel; statuses PENDING /
REGISTERED / CANCELED; "Check and Insert" runs the shop checks (Shahkar included) and on
success creates the Shop; SMS to the requester with the template variable shown to the
admin first (editable, or not sent at all).
User's answers: logo upload allowed for visitors, wallet balance hidden (set at Check and
Insert); **one shop per person**: national code and mobile are refused if any shop has them
(admin-created shops too, checked in ShopService, no schema change); 3 accepted requests per
IP per hour; a failed check **cancels** the request. Two sms.ir templates: rejection (`INFO`,
for failed checks and the admin's cancels) and welcome (`SUBDOMAIN`). Template ids are
placeholders (`000000`) until the user creates them.

Backend:
- `prisma/schema/tobe-shop.prisma`: model `TobeShop` → table `tobe-shop` (the shop form's
  fields, status, `problem`, `shopId` without a relation, `smsSentAt`, `ip`). `db push` done.
- `ShopService.findTaken` (subdomain / national code / mobile); `createShop` refuses all
  three (NationalCodeTaken, PhoneNumberTaken are new). ShopModule exports ShopService.
- `SmsIrService.sendShopRejected(INFO)` / `sendShopWelcome(SUBDOMAIN)` over a shared
  `sendTemplate`; config `smsIrShopRejectedTemplate`, `smsIrShopWelcomeTemplate`.
- `libs/rate-limit`: in-memory `RateLimiter` + `clientIp` (`X-Real-IP` from nginx, else socket).
- `modules/tobe-shop`: public `submitTobeShop` (all taken fields at once; saved + admins
  texted only when none; 20 attempts / 3 accepted per IP per hour) and
  `createTobeShopLogoUpload` (10 per IP per hour); admin `readTobeShops`,
  `checkAndInsertTobeShop` (via `ShopService.createShop`; Shahkar mismatch / taken values →
  CANCELED with a Persian `problem` that includes the data; Shahkar down → error, stays
  PENDING; double clicks refused), `cancelTobeShop` (PENDING only), `sendTobeShopSms`
  (once; template picked by status). 12 tests + 1 rate-limiter test.

Frontend:
- `components/shop/ShopForm.tsx`: the one shop form (required `*`, the "mobile and national
  code must both belong to the owner" note); `CreateShopForm` (admin) and
  `site/ShopRequestForm` (public) wrap it.
- `/signup`: the public form, called **from the browser** (`lib/signup-api.ts`) so the
  per-IP limit sees the visitor; on success «… حداکثر تا ۲۴ ساعت آینده از طریق پیامک …».
- Landing: contact section and `ContactLinks` removed, every "contact" button → `/signup`;
  `CONTACT_*` removed from the frontend .env files and DEPLOY.md.
- Admin `/panel/requests` (nav «درخواست‌ها»): status chips, each request's data, «بررسی و ثبت»
  (wallet balance → result → SMS form), «لغو درخواست» (→ SMS form), «ارسال پیامک» later
  if skipped. The SMS form shows the template, the variable name and its prefilled value.
- Mishap: `lib/public-api.ts` (the cookie-less `publicApi()`) was overwritten by mistake and
  restored word for word from Next's dev source maps.


### National code: 10 digits only (2026-11-08)

- `isValidNationalCode` (packages/shared) now only checks for exactly 10 digits; the
  check-digit test is gone, by the user's choice: Shahkar decides whether a code is real.
  Same function in the browser (shop form, customer verification) and the backend
  (`@IsNationalCode`). Error text: «کد ملی ۱۰ رقم است.»
