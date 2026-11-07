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

| Shared through the server | Still stored on each device |
|---|---|
| Customer sign-in (email OTP) and sessions | Product catalogue edits, orders, cart, wishlist, reviews, repairs, offers |
| Activity feed and customer list in the owner **Activity** panel | |

Orders placed in the app are not yet visible in the website's owner portal (and vice-versa); moving shop data to the server is the next step.
