# Product

## Goal

An app for jewellery sellers to **identify a customer before finalising an invoice**.
The customer is identified by three things, and all three matter:

1. **Phone number** (mobile)
2. **SSN** — Iranian national code (کد ملی)
3. **Bank card number** the customer is going to pay with

## Known building blocks

Darik (`../backend`) already integrates the api.ir identity services in
`src/libs/shahkar/shahkar.service.ts`:

- **Shahkar** — checks that a mobile number is registered to a national code.
- **CardMatch** — checks that a 16-digit card belongs to a national code + birth date
  (Jalali, `1370/1/1`).

These are the likely backbone of verification. Whether we reuse them is **not decided yet**.

## Open questions (ask the user, do not guess)

- Who logs in: one seller, many sellers (multi-tenant shops), staff per shop?
- Exact verification flow and order of steps; is birth date collected (CardMatch needs it)?
- Is OTP to the customer's phone part of the flow?
- What is an invoice here — do we create invoices, or only produce a verification
  record the seller attaches to their own invoice?
- What is stored, for how long, and how card numbers are stored (masked / hashed)?
- Which identity provider(s) and credentials.

Answers get recorded here as the user gives them.
