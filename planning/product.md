# Product

## Goal

An app for jewellery sellers to **identify a customer before finalising an invoice**.
The customer is identified by three things, and all three matter:

1. **Phone number** (mobile)
2. **SSN** — Iranian national code (کد ملی)
3. **Bank card number** the customer is going to pay with

## Decided

- **Domain:** zarimen.ir. "Shop" = a jewellery shop, the app's customer segment.
- **Multi-shop:** every shop has its own subdomain and dashboard, e.g.
  setoode.zarimen.ir, rahimi.zarimen.ir.
- **Admins** (a list of phone numbers in `.env`), the only ones who can add shops and enable/disable them. Admin panel at
  zarimen.ir/panel, login by SMS code.
- **Shop fields:** name, brand name, subdomain, active, logo (Arvan S3, `zar-imen/`),
  address, landline, owner full name, owner phone, owner national code. The owner's
  phone ↔ national code is checked with Shahkar when the shop is added.
- **Wallet:** each shop (owner) has one, holding a balance in whole Tomans; the admin may
  set an initial amount on creation and change it later. It pays for the shop's
  customers' Shahkar checks and SMS.
- **Shop login:** the owner logs in at <subdomain>.zarimen.ir/panel with an SMS code sent
  to the shop's owner phone. A disabled shop cannot log in.

- **Landing page** `<sub>.zarimen.ir`: logo, shop info, a big «احراز هویت مشتری» button.
- **Customer verification** `<sub>.zarimen.ir/verify`, 3 phases with a step indicator:
  1. national code + mobile + Jalali birth date → Shahkar (phone ↔ national code); skipped
     when exactly these three are already saved for one customer
  2. SMS code to that mobile → customer saved (unique by national code), linked to the shop
  3. the customer's cards; adding a card → CardMatch (card ↔ national code + birth date)
  Returning customers log in with mobile + SMS code and go straight to phase 3.
- **Service costs:** the admin sets a Toman price for Shahkar checks and for SMS on
  zarimen.ir/panel/settings. Each one a shop's customers trigger is taken from that shop's
  wallet; with too little balance the request does not run.
- **Customers ↔ shops:** many-to-many. Each shop owner sees the customers linked to their shop.

## Known building blocks

Darik (`../backend`) already integrates the api.ir identity services in
`src/libs/shahkar/shahkar.service.ts`:

- **Shahkar** — checks that a mobile number is registered to a national code.
- **CardMatch** — checks that a 16-digit card belongs to a national code + birth date
  (Jalali, `1370/1/1`).

Both are copied into `apps/backend/src/libs/shahkar`. Shahkar is used for the shop
owner today; customer verification will use them too.

## Open questions (ask the user, do not guess)

- Who logs in on a shop subdomain: only the owner, or staff too? (owner phone is stored)
- Exact verification flow and order of steps; is birth date collected (CardMatch needs it)?
- What is an invoice here — do we create invoices, or only produce a verification
  record the seller attaches to their own invoice?
- What is stored, for how long, and how card numbers are stored (masked / hashed)?
- Which identity provider(s) and credentials.
- Wallet: how shops top it up (today only the admin sets the balance).

Answers get recorded here as the user gives them.
