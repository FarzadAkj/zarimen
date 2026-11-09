# Deploying Zar Imen

How to run Zar Imen on one Ubuntu server: build on the server, run both apps with PM2, and
put nginx in front for HTTPS. The commands assume Ubuntu 22.04/24.04 and a sudo user called
`ubuntu`; change names and paths as needed.

```
                      ┌────────────── nginx (80/443, TLS) ──────────────┐
https://api.zarimen.ir│  → 127.0.0.1:8010  backend  (NestJS, PM2)       │
https://zarimen.ir    │                                                 │
https://www.zarimen.ir│  → 127.0.0.1:3010  frontend (Next.js, PM2)      │
https://*.zarimen.ir  │     (shop subdomains, routed by Host header)    │
                      └──────────────────────────────────────────────────┘
                         PostgreSQL on localhost:5432 (not exposed)
```

---

## 1. DNS

At your domain's DNS provider, point these records at the server's IP:

| Type | Name            | Value       |
| ---- | --------------- | ----------- |
| A    | `zarimen.ir`    | `SERVER_IP` |
| A    | `www`           | `SERVER_IP` |
| A    | `api`           | `SERVER_IP` |
| A    | `*` (wildcard)  | `SERVER_IP` |

The wildcard record makes every shop subdomain (`setoode.zarimen.ir`, …) reach the server
with no change per shop. `api`, `www` and `panel` are reserved, so no shop can take them.

---

## 2. Server packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx postgresql ufw

# Node.js 22 (the backend's start command uses Node 22's --env-file)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm — the same major version as the lockfile (the repo pins pnpm@8.4.0)
sudo corepack enable
corepack prepare pnpm@8.4.0 --activate

# PM2 keeps both apps running and restarts them on reboot
sudo npm install -g pm2

node -v    # v22.x
pnpm -v    # 8.4.0
```

Bun is **not** needed on the server: it is only used for `pnpm dev` and for regenerating the
API client on your own machine.

Firewall: only SSH and the web ports are open. 8010, 3010 and 5432 stay private.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. Database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER zar_imen WITH PASSWORD 'CHANGE-ME-strong-password';
CREATE DATABASE zar_imen OWNER zar_imen;
SQL
```

Write down the password; it goes into `DATABASE_CONNECTION_URL` in step 5.

---

## 4. Get the code

```bash
sudo mkdir -p /srv/zar-imen && sudo chown ubuntu:ubuntu /srv/zar-imen
git clone <YOUR-REPO-URL> /srv/zar-imen
cd /srv/zar-imen
```

---

## 5. Configuration

Neither `.env` file is in git. Create both on the server; the `.env.example` next to each is
the template.

### `apps/backend/.env`

```ini
NODE_ENV = production
DATABASE_CONNECTION_URL = "postgres://zar_imen:CHANGE-ME-strong-password@localhost:5432/zar_imen"
serverPort = 8010
swaggerApiDocPath = /api-docs
swaggerApiPath = /api

# ---- auth
# 32+ random characters: openssl rand -base64 48
jwtSecret = "PASTE-A-LONG-RANDOM-STRING"
jwtExpire = "10d"
# the admins, comma-separated
adminPhoneNumbers = "0912xxxxxxx,0935xxxxxxx"

# ---- sms.ir
smsIrSecret = "your-sms-ir-api-key"
smsIrOtpTemplate = "your-template-id"
# sender line for bulk notices to the admins (new tickets, new shop requests)
smsIrLineNumber = "your-sms-ir-line-number"
# shop requests (zarimen.ir/signup): rejection (INFO parameter) and welcome (SUBDOMAIN parameter)
smsIrShopRejectedTemplate = "your-template-id"
smsIrShopWelcomeTemplate = "your-template-id"
# to the owner when a customer adds a card (SUBDOMAIN + SSN parameters)
smsIrCardAddedTemplate = "449513"
sendSms = true

# ---- api.ir (Shahkar + CardMatch)
ApiIRToken = "your-api-ir-token"
identityCheck = true

# ---- ArvanCloud bucket (shop logos)
imageBucketBaseUrl = "https://your-bucket.s3.ir-central1.arvanstorage.ir"
arvanRegion = "default"
arvanAccessKey = "..."
arvanSecretKey = "..."

# ---- shop sites + Zarinpal
shopSiteUrl = "https://{subdomain}.zarimen.ir"
zarinPalMerchantId = "your-real-merchant-id"
backendUrl = "https://api.zarimen.ir"
# empty = real Zarinpal (no sandbox)
zarinpalBaseUrl =
```

Check before you go live:

- `NODE_ENV = production` turns Swagger off, so `/api` and `/api-docs` are not public.
- `sendSms = true` and `identityCheck = true`; with `false`, codes are only printed and
  Shahkar is skipped.
- `zarinpalBaseUrl` is **empty**, so payments use the real Zarinpal and not the sandbox.
- The api.zarimen.ir nginx block sets `X-Real-IP $remote_addr`: the public shop-request form
  is limited per IP using it (without it every visitor would share one limit).

### `apps/frontend/.env`

```ini
NEXT_PUBLIC_SERVER_ADDRESS = https://api.zarimen.ir
NEXT_PUBLIC_SWAGGER_API_DOC_PATH = /api-docs
ROOT_DOMAIN = zarimen.ir
```

`NEXT_PUBLIC_*` values are built **into** the frontend bundle. After changing one, rebuild
(step 6), not only restart. `NEXT_PUBLIC_SERVER_ADDRESS` must have **no trailing slash**
(`https://api.zarimen.ir`, not `…/`); otherwise every request goes to `//auth/...` and 404s.

---

## 6. Install, create the tables, build

```bash
cd /srv/zar-imen
pnpm install --frozen-lockfile          # also generates the Prisma client
pnpm --filter @zar-imen/backend db:push # creates / updates the tables from prisma/schema
pnpm build                              # backend → apps/backend/dist, frontend → apps/frontend/.next
```

`db:push` makes the database match the schema. It refuses changes that would lose data unless
you confirm, so read anything it prints before you confirm.

---

## 7. Start with PM2

```bash
cd /srv/zar-imen
pm2 start ecosystem.config.cjs
pm2 save                    # remember these processes
pm2 startup                 # prints one sudo command: run it, so PM2 starts on boot

pm2 status                  # both "online"
pm2 logs zar-imen-backend --lines 50   # expect: ✔ Listening on :8010
```

(Without PM2, `pnpm start` runs the same two built apps in the foreground, which is handy for a
quick test. It does not restart them after a crash or reboot.)

Keep **one** backend instance. The jobs that cancel abandoned Zarinpal payments every 10
minutes run inside it.

Local check before nginx:

```bash
curl -X POST http://127.0.0.1:8010/subscription/readPublicPlans   # JSON list
curl -I -H "Host: zarimen.ir" http://127.0.0.1:3010/              # 200
```

---

## 8. TLS certificate (wildcard)

Shop subdomains need a **wildcard** certificate for `*.zarimen.ir`. A wildcard can only be
issued with a DNS check (DNS-01), not over HTTP. Two ways:

**A) acme.sh with your DNS provider's API (renews by itself).** If the domain's DNS is on
ArvanCloud:

```bash
curl https://get.acme.sh | sh -s email=you@example.com
source ~/.bashrc
export Arvan_Token="apikey xxxxxxxx"          # ArvanCloud panel → API keys
~/.acme.sh/acme.sh --issue --dns dns_arvan -d zarimen.ir -d '*.zarimen.ir' --server letsencrypt

sudo mkdir -p /etc/ssl/zarimen
~/.acme.sh/acme.sh --install-cert -d zarimen.ir \
  --key-file       /etc/ssl/zarimen/key.pem \
  --fullchain-file /etc/ssl/zarimen/fullchain.pem \
  --reloadcmd      "sudo systemctl reload nginx"
```

For another DNS provider, use its `dns_*` plugin: https://github.com/acmesh-official/acme.sh/wiki/dnsapi

**B) certbot with a manual TXT record** (renew by hand every ~90 days):

```bash
sudo apt install -y certbot
sudo certbot certonly --manual --preferred-challenges dns -d zarimen.ir -d '*.zarimen.ir'
# add the TXT record it shows, wait a minute, press Enter
# files: /etc/letsencrypt/live/zarimen.ir/{fullchain.pem,privkey.pem}
```

The certificate covers `zarimen.ir`, `www`, `api` and every shop.

---

## 9. nginx

`/etc/nginx/sites-available/zar-imen` (change the two certificate paths if you used certbot):

```nginx
# http → https
server {
    listen 80;
    server_name zarimen.ir *.zarimen.ir;
    return 301 https://$host$request_uri;
}

# backend: api.zarimen.ir
server {
    listen 443 ssl http2;
    server_name api.zarimen.ir;

    ssl_certificate     /etc/ssl/zarimen/fullchain.pem;
    ssl_certificate_key /etc/ssl/zarimen/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8010;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# frontend: zarimen.ir, www and every shop subdomain
server {
    listen 443 ssl http2;
    server_name zarimen.ir www.zarimen.ir *.zarimen.ir;

    ssl_certificate     /etc/ssl/zarimen/fullchain.pem;
    ssl_certificate_key /etc/ssl/zarimen/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3010;
        # REQUIRED: the frontend tells shops apart by the Host header
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

nginx sends `api.zarimen.ir` to the backend because an exact name wins over the
`*.zarimen.ir` wildcard.

```bash
sudo ln -s /etc/nginx/sites-available/zar-imen /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 10. Outside services

| Service | What to set |
| ------- | ----------- |
| **Zarinpal** (merchant panel) | The site's domain must be `zarimen.ir`. Payments return to `https://api.zarimen.ir/wallet/topUpCallback` and `/subscription/purchaseCallback`, both on that domain. |
| **sms.ir** | A "verify" template with one parameter named **`CODE`**; its id → `smsIrOtpTemplate`. Template 449513 (`SUBDOMAIN`, `SSN`; text links to `https://#SUBDOMAIN#.zarimen.ir/panel/customers?ssn=#SSN#`) → `smsIrCardAddedTemplate`. A line with enough credit. |
| **api.ir** | A token with Shahkar and CardMatch enabled and credit. |
| **ArvanCloud bucket** | The panel uploads logos **from the browser** straight to the bucket, so the bucket's CORS must allow `PUT` from `https://zarimen.ir` (headers: `content-type`, `x-amz-acl`). Without it, logo upload fails in the browser. |

---

## 11. Smoke test

1. `https://zarimen.ir`: landing page with the plans; the padlock shows a valid certificate.
2. `https://zarimen.ir/panel`: log in with an admin phone. A real SMS arrives.
3. Admin: add a test shop, set its subscription end date (pencil) to a few days ahead, and
   set the service prices on «تنظیمات».
4. `https://<subdomain>.zarimen.ir`: the shop's landing page with the big button.
5. `https://<subdomain>.zarimen.ir/panel`: owner login, then «کیف پول»: top up a small
   amount. You go to Zarinpal and come back with a success banner; the amount is in
   «تراکنش‌ها».
6. `https://<subdomain>.zarimen.ir/verify`: sign up as a customer (real Shahkar + SMS) and add
   a card (real CardMatch). The owner's «مشتریان» shows it, and the wallet history shows the
   charges.
7. `https://api.zarimen.ir/api` returns 404 (Swagger is off in production).

---

## 12. Updating to a new version

```bash
cd /srv/zar-imen
git pull
pnpm install --frozen-lockfile
pnpm --filter @zar-imen/backend db:push    # only does something when the schema changed
pnpm build
pm2 restart zar-imen-backend zar-imen-frontend
```

Restart the backend after **every** update, not only reload. A schema change regenerates the
Prisma client, and a process still running the old one fails with errors like
"Argument … is missing".

---

## 13. Backups

Daily database dump at 03:30, keeping 14 days:

```bash
sudo mkdir -p /var/backups/zar-imen && sudo chown postgres /var/backups/zar-imen
sudo -u postgres crontab -e
```

```cron
30 3 * * * pg_dump zar_imen | gzip > /var/backups/zar-imen/zar_imen-$(date +\%F).sql.gz && find /var/backups/zar-imen -name '*.sql.gz' -mtime +14 -delete
```

Restore:

```bash
gunzip -c /var/backups/zar-imen/zar_imen-YYYY-MM-DD.sql.gz | sudo -u postgres psql zar_imen
```

Copy the dumps off the server too (another machine, or a private bucket). A backup that only
lives on the same disk is lost with it.

---

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| Backend exits right after start | A `.env` value is missing or wrong; `pm2 logs zar-imen-backend` names it (`Config validation failed`). |
| Every shop subdomain shows the main site / 404 | nginx is not passing `Host` (`proxy_set_header Host $host;`), or `ROOT_DOMAIN` is not `zarimen.ir`. |
| Certificate error on shop subdomains | The certificate has no `*.zarimen.ir` (step 8). |
| After paying, Zarinpal shows an error page | `backendUrl` is wrong or not public, or the domain is not registered in Zarinpal. |
| "Argument … is missing" after an update | The backend was not restarted after the schema / client changed: `pm2 restart zar-imen-backend`. |
| Logo upload fails in the browser | ArvanCloud bucket CORS (step 10). |
