# Dev Computer

The main web app in `frontend/` currently runs without Supabase. Customer, owner and delivery portals open directly without email/OTP. Products, orders, profiles, reviews and returns use browser-local storage on this device and origin. Use sample personal details. No real payments are processed, and records do not sync between devices.

## Run locally
From the repository root:
```powershell
git pull origin main
npm run setup
npm run build
npm start
```
Open http://localhost:8080. Owner: http://localhost:8080/?portal=admin. Delivery: http://localhost:8080/?portal=delivery. Stop an old server first and refresh with Ctrl+Shift+R after updating.

The old Expo UI and separate demo folder remain removed. Supabase integration source is retained for later reconnection but is not imported or bundled. Existing remote database records are unchanged.

Run `npm run check` and `npm test` for local validation. `test:live` in the frontend is a manual integration check only; it is not run by default.

## Offers and events

Owner portal → Manage offers → Create promotion. Add an offer/event title, announcement, optional image, dates and terms. Publish or save a draft, select banner placement, edit, unpublish or delete later. Customers use Offers & events; only current published announcements appear. Offers advertise listed product prices; they do not apply automatic discounts. Change product prices separately for a sale. Data is shared between portals only on the same browser and origin.

## Delivery requests and tracking

After confirming an order, the owner selects **Send delivery request**, enters the pickup address and both map pins, then sends it to the local delivery partner. Customers can optionally add their own destination pin at checkout. Pins can be typed, chosen on the map, or captured with browser location permission.

The delivery portal separates incoming requests and accepted jobs. The partner accepts or declines; dispatch/status changes are locked until acceptance. The owner can withdraw a pending/accepted request before shipment and send another.

**Map & tracking** shows pickup, destination and the partner's last reported location. An accepted driver can start/stop GPS sharing or enter a labelled manual position. Sharing stops when leaving the tracking view; a timestamp and accuracy distinguish current reports from old data. A dashed connection shows straight-line distance only, not road routing or an ETA. The trail stores at most 40 points. Street tiles use OpenFreeMap/OpenStreetMap and require internet.

Supabase stays disconnected: requests and location updates are saved in this browser, shared across tabs on the same origin. This does not track another person's phone or sync between devices. GPS requires browser permission and HTTPS (or localhost); no fake GPS positions are generated.

Search shows matching products directly below the search box and hides the banner/categories until cleared. Added products show a tick; successful additions animate the cart once. Delivered orders expose an app-generated receipt to their customer and owner, downloadable as HTML or printable / saveable as PDF. These local receipts are not payment confirmations or GST invoices.

Repair Centre: customers upload an item photo and describe the problem to receive a REP tracking ID. Owners set repair status and price and send in-app messages; Ready for pickup adds a collection message. Repairs and delivery updates remain browser-local while Supabase is disconnected. No SMS/WhatsApp is sent.

Location forms use area/city/landmark search (Photon/OpenStreetMap), current GPS or map selection, with no visible coordinate fields. Area searches require internet and the chosen place is approximate; manual area updates are distinguished from live GPS. Live tracking still needs the delivery partner to allow GPS and keep the tracking screen open.

Owner categories: open Owner portal → Products → Manage categories. Enter a category name and choose an icon, then use Add item to open a product form with that category selected. New categories appear in the customer catalogue and the product editor. Category names are checked for duplicates; all data remains browser-local. Selected category icons use dark strokes on lime for contrast.

## Android app

An installable Android project is now available in `frontend/android`. See [ANDROID.md](ANDROID.md) for Windows / Android Studio setup, testing and APK instructions. Run `npm run setup`, `npm run android:sync`, then `npm run android:open` from the repository root. Native GPS uses Capacitor Geolocation; web browsers retain browser GPS. Android compilation/device QA is pending and local-only demo limitations remain.

## Deploying the website (Render)

The repo includes `render.yaml` and a `Dockerfile`. The Docker image serves the committed `frontend/dist`, so run `npm run build` and commit `frontend/dist` before pushing changes you want live.

1. Push to GitHub `main`.
2. On [render.com](https://render.com): **New → Blueprint**, pick this repository. It creates the `dev-computer` web service (Starter plan) with a 1 GB disk at `/data` for shop data, customers, sessions and the admin key.
3. Fill the values Render asks for:
   - `OWNER_EMAILS`: the owner's email (owner portal: `/?portal=admin`)
   - `DELIVERY_EMAILS`: delivery partners' emails (`/?portal=delivery`), comma separated
   - `SMTP_HOST` `smtp.gmail.com`, `SMTP_USER` your Gmail, `SMTP_PASS` a Gmail **app password**, `SMTP_FROM` e.g. `Dev Computer <you@gmail.com>`
   - `ADMIN_KEY` is generated automatically. Never set `DEV_OTP` on the hosted site.
4. Deploy. Render gives an `https://dev-computer-xxxx.onrender.com` address; `/api/health` should return `{"ok":true}`. A custom domain can be added under **Settings → Custom Domains**.
5. Pushes to `main` redeploy automatically.

For the Android / Play Store build, set `API_URL` to that https address in `frontend/.env`, then run `npm run android:sync` so the app uses the same shop and accounts as the website.

Still demo-only on the hosted site: online payments are simulated (no money is charged), and delivery requests and location updates are kept per browser rather than synced between devices.
