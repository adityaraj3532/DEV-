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

## Delivery requests and tracking

After confirming an order, the owner selects **Send delivery request**, enters the pickup address and both map pins, then sends it to the local delivery partner. Customers can optionally add their own destination pin at checkout. Pins can be typed, chosen on the map, or captured with browser location permission.

The delivery portal separates incoming requests and accepted jobs. The partner accepts or declines; dispatch/status changes are locked until acceptance. The owner can withdraw a pending/accepted request before shipment and send another.

**Map & tracking** shows pickup, destination and the partner's last reported location. An accepted driver can start/stop GPS sharing or enter a labelled manual position. Sharing stops when leaving the tracking view; a timestamp and accuracy distinguish current reports from old data. A dashed connection shows straight-line distance only, not road routing or an ETA. The trail stores at most 40 points. Street tiles use OpenFreeMap/OpenStreetMap and require internet.

Supabase stays disconnected: requests and location updates are saved in this browser, shared across tabs on the same origin. This does not track another person's phone or sync between devices. GPS requires browser permission and HTTPS (or localhost); no fake GPS positions are generated.
