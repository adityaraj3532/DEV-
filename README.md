# ElectroShop

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
