# Dev Computer frontend

This is the main Supabase-connected web app. See [project instructions](../README.md) and [Supabase setup](supabase/README.md).

From this directory: `npm ci`, `npm run build`, `npm start`.

## Local backend and owner Activity panel

`npm start` runs `serve.mjs`, which serves the app and a small dependency-free API:

- `POST /api/events` — customer sign-ins and activity (rate limited, validated).
- `GET /api/admin/summary | customers | activity?email=&type=&limit=` — requires the `x-admin-key` header.

Data is written to `frontend/data/` (git-ignored): `customers.json`, `activity.jsonl` and `admin-key.txt`.
The admin key is generated on first start; set `ADMIN_KEY` to choose your own. `PORT`, `HOST` and `DATA_DIR` are also configurable.

Open `http://localhost:8080/?portal=admin`, choose **Activity**, and enter the admin key to see signed-in customers
(name, email, phone, sign-ins, orders, spend) and a filterable activity feed. Without the backend (e.g. the Android
build) the panel falls back to activity recorded in that browser.

Note: customer sign-in is not yet verified (no OTP/password), so names and emails are self-reported.
