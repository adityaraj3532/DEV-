# Dev Computer frontend

This is the main Supabase-connected web app. See [project instructions](../README.md) and [Supabase setup](supabase/README.md).

From this directory: `npm ci`, `npm run build`, `npm start`.

## Local backend and owner Activity panel

`npm start` runs `serve.mjs`, which serves the app and a small dependency-free API:

- `POST /api/events` — customer sign-ins and activity (rate limited, validated).
- `GET /api/admin/summary | customers | activity?email=&type=&limit=` — owner session or the `x-admin-key` header.
- `/api/shop/*` — the shop itself (`server/shop.mjs`): products, orders, delivery, returns, reviews, promotions,
  repairs, categories and each user's own cart/wishlist/profile. `GET /api/shop/state` returns what the signed-in
  role may see. All rules (stock, prices, owner-only actions, delivery assignment) are enforced on the server.

Roles: `OWNER_EMAILS` and `DELIVERY_EMAILS` (comma separated) decide who is an owner or delivery partner; everyone
else who signs in is a customer. Staff sign in with the same email code at `/?portal=admin` and `/?portal=delivery`.

Data is written to `frontend/data/` (git-ignored): `shop.json`, `customers.json`, `activity.jsonl`, `sessions.json` and `admin-key.txt`.
The admin key is generated on first start; set `ADMIN_KEY` to choose your own. `PORT`, `HOST` and `DATA_DIR` are also configurable.

Open `http://localhost:8080/?portal=admin`, sign in with an owner email, and choose **Activity** to see signed-in customers
(name, email, phone, sign-ins, orders, spend) and a filterable activity feed. Without the backend (e.g. the Android
build) the panel falls back to activity recorded in that browser.

### Customer sign-in (email OTP)

Customers enter name, email and optional phone, receive a 6-digit code, and enter it to sign in.
Codes expire after 10 minutes, are single use, allow 5 attempts, and can be resent every 30 s (max 5/hour).
Sign-in creates a 30-day session token (only its hash is stored in `data/sessions.json`); activity is
attributed only to verified sessions.

Without SMTP settings the server runs in **development mode** and prints codes in its terminal. To send real email:

```bash
SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com SMTP_PASS=app-password SMTP_FROM="Dev Computer <you@gmail.com>" npm start
```

Port 465 uses TLS; other ports require STARTTLS. Customer sign-in needs this server, so the offline Android build cannot sign customers in.
