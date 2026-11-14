# Run Dev Computer as a website and an Android app

One Node server (`frontend/serve.mjs`) serves the website **and** the API (customer OTP sign-in, activity, admin panel).
The Android app is the same frontend packaged with Capacitor; it talks to that server over https.

```
 Browser ──https──▶  your server (website + /api)  ◀──https──  Android app (API_URL baked in at build)
```

## 1. Put the server online

Any host that runs Docker or Node 22+ works. It needs **persistent storage** for `DATA_DIR`
(customers, sessions, activity, admin key) and **https**.

**Render (blueprint included):** push this repo to GitHub → Render → New → Blueprint → select the repo.
`render.yaml` builds the `Dockerfile`, mounts a 1 GB disk at `/data` and generates `ADMIN_KEY`.
Fill in `SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM` so customers receive codes by email.
Your site will be at `https://<name>.onrender.com`.

**Any Docker host:**
```bash
docker build -t dev-computer .
docker run -d -p 8080:8080 -v devcomputer-data:/data --env-file frontend/.env dev-computer
```
Put it behind https (Caddy, Nginx + Let's Encrypt, Cloudflare) and set `TRUST_PROXY=1`.

**Plain Node (VPS):** `HOST=0.0.0.0 TRUST_PROXY=1 npm start` with settings in `frontend/.env` (see `frontend/.env.example`).

Check it: open `https://your-domain/api/health` → `{"ok":true}`; the owner portal is `https://your-domain/?portal=admin`.

## 2. Build the Android app against that server

In `frontend/.env` set:
```
API_URL=https://your-domain
```
Then from the repo root:
```bash
npm run android:sync     # builds the web app with API_URL and copies it into the Android project
npm run android:apk      # debug APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
or `npm run android:open` to build/sign a release in Android Studio. `API_URL` must be https.

## What is shared between website and app

Everything is stored in the server's SQLite database (`DATA_DIR/dev-computer.db`, see [DATABASE.md](DATABASE.md)), so the website and the app show the same shop:
products and categories, orders and delivery, returns, reviews, offers and events, repairs, and each signed-in
person's cart, wishlist, saved addresses and profile. Only a guest's cart/wishlist stays on the device until they sign in.

Set who runs the shop before going live (hosting dashboard or `frontend/.env`):

```
OWNER_EMAILS=you@gmail.com
DELIVERY_EMAILS=driver1@gmail.com,driver2@gmail.com
```

Owners and delivery partners sign in with the same email code as customers at `/?portal=admin` and `/?portal=delivery`.
Anyone else who signs in is a customer.
