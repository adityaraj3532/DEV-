# Dev Computer

Electronics shopping and store management, implemented incrementally with **Expo / React Native**, a responsive web owner dashboard, and **Supabase PostgreSQL, Auth, Storage, RLS and Edge Functions**.

See [feature match and roadmap](FEATURES.md) for the exact shipped/pending status of every requested area. This update completes the first foundation increment, not the entire long-term product.

## Run the web shop and owner dashboard
From the repository root in Windows PowerShell:
```powershell
git pull origin main
npm run setup
npm run build
npm start
```
Open http://localhost:8080. Owner: http://localhost:8080/?portal=admin. Delivery: http://localhost:8080/?portal=delivery. Stop the old server first and refresh with Ctrl+Shift+R after updating.

## Run the Expo app
```powershell
npm run setup:mobile
npm run mobile
```
Scan the Expo QR code with a compatible Expo Go/development client, or run `npm run mobile:web` for React Native Web. SDK 58 is used; device clients must support that SDK. Android/iOS builds are not distributed yet.

## Included in increment 1

- Dev Computer branding; catalogue, categories, brand/budget filters, product details, SKU/specifications, cart and wishlist.
- Protected owner product CRUD, photo upload, inventory adjustments with reasons, low-stock overview, and web audit log.
- Real shared Supabase data; clients refresh every 15 seconds and when returning to the app. No local sample-inventory fallback.
- Server-validated COD orders with stock locking and retry keys; owner confirmation required before shipping. Native customer cancellations restore stock once before shipment.
- Existing web profile/address, delivery, returns/reviews and offers features preserved; offers and events now persist in Supabase. Native offers are viewable too.
- A JWT-protected `dev-computer-checkout` Edge Function validates a verified caller and invokes the transactional database checkout.

**Login setup:** owner email `adityaraj3532@gmail.com`. Custom SMTP is still needed to resolve the earlier Supabase email quota issue. Existing unexpired codes/links can be verified. Public browsing requires no login; real purchases and owner changes do.

**Not connected yet:** online payments/refunds, GST invoices, PC Builder, repair/warranty, advanced business tools, AI, WhatsApp, push and courier APIs. No fake payment successes or mock production orders are used.

## Structure

- `mobile/`: Expo Router application with reusable native UI and a shared store adapter.
- `frontend/`: responsive customer/owner/delivery web client.
- `frontend/supabase/`: initial SQL, applied upgrade SQL and rollback verification scripts. The existing `electroshop` schema/bucket names are retained to preserve records; the product brand is Dev Computer.
- `supabase/functions/dev-computer-checkout/`: deployed checkout Edge Function source.
- `FEATURES.md`: feature audit and staged plan.

Only public Supabase configuration is bundled. Never put service-role or payment secrets in either client. Row permissions and authoritative stock/price checks run on the server.

## Validation

```powershell
npm run check
npm test
npm run check:mobile
npm run build:mobile
```
Database rollback scripts test role boundaries, stock locking behavior, stale-edit rejection, retry keys, promotions, cancellation, returns and review eligibility without retaining synthetic records. The live API check sends no sign-in emails.
