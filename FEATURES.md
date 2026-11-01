# Dev Computer feature match and delivery stages

This is increment 1, not a claim that every requested integration is finished. Both clients use the same Supabase database. The Expo application lives in `mobile/`; the responsive storefront/owner dashboard lives in `frontend/`.

| Requested area | Current implementation | Remaining work |
|---|---|---|
| Brand and responsive design | Dev Computer navy/orange identity; responsive web and Expo screens | Device-specific polish after physical testing |
| Catalogue | Search, preset categories, brands and price filtering; details, SKU and specifications | Dynamic category CRUD and advanced attribute filters |
| Product range | Laptop, desktop, monitor, PC component, keyboard, mouse, printer, networking, software, refurbished, accessory; older audio/camera categories preserved | Owner must enter real products; no invented stock is listed |
| Cart and wishlist | Guest persistence; signed-in private persistence; guest cart merges on mobile sign-in | Conflict resolution for simultaneous profile edits |
| Checkout and orders | COD; server-calculated prices, sorted row locks, stock reservation; checkout Edge Function and retry keys; owner confirmation before shipping | Payment gateway and shipping provider |
| Profile and addresses | Web CRUD/default addresses; mobile profile, address creation, selection and list | Mobile address editing/removal parity |
| Tracking and cancellations | Owner/delivery status updates on web; mobile owner status transitions and customer history; server cancellation before shipping restores stock once | External courier tracking |
| Returns, reviews | Existing web return policy, eligible return requests/owner decisions, delivered-purchase reviews with photos | Native returns/reviews screens and gateway refunds |
| Offers, banners, events | Web owner publishing/scheduling/images/terms; customer offers on both clients; shared database | Homepage content manager, coupon engine and automatic discounts |
| Inventory | Product stock, low-stock list, SKU/barcode field, additive reasoned adjustments and audit trail | Camera barcode/QR scanning, suppliers/purchases, reports |
| Security and backend | PostgreSQL, real Auth, Storage, RLS, protected RPCs, checkout Edge Function, server role/ownership checks, audit logs | Expand scoped staff permission model and harden production operations |
| Cross-device updates | Shared authoritative data; refresh every 15 seconds and on foreground/focus; no browser-local product/order fallback | Realtime subscriptions and notification fan-out |
| PC Builder | Planned stage 3 | Structured component data, socket/RAM/form-factor/PSU rules, budget suggestions and price calculation |
| Payments, GST, loyalty | COD only; online payments visibly unavailable | Stage 2: provider order creation/webhook verification, refund ledger, GST configuration/invoices/receipts, coupons, loyalty |
| Repair and warranty | Planned stage 4 | Service bookings, serial/device history, technician assignment, warranty claims and repair tracking |
| Business tools | Order and stock overviews; audit log | Stage 5: cost/profit model, analytics, best sellers, quotations/PDF, bulk orders, CRM and staff |
| Smart features | Planned stage 6 | Comparisons, recommendations, trade-in estimates, AI assistant, price/stock alerts |
| Integrations | Checkout Edge Function active | Stage 6: WhatsApp, push and shipping accounts; payment integration starts in stage 2 |

## Next increments

1. **Foundation (this update):** catalogue, protected owner dashboard, inventory, cart, shared database, Expo routes, COD ordering, persistent promotions and auditing.
2. **Commerce operations:** payment provider and secure webhook verification, refunds, GST/invoices, coupon rules, dynamic category management, native returns/reviews parity and barcode/supplier records.
3. **PC Builder:** component taxonomy and verified compatibility data before recommendations.
4. **Service desk:** repair/warranty bookings, technician roles and device history.
5. **Business management:** costs, analytics, quotes, bulk orders, CRM and staff permissions.
6. **Messaging and intelligence:** WhatsApp/push/shipping notifications, recommendations, comparisons, AI and trade-in/price alerts.

## Operational requirements

- Real owner/customer access requires verified email. Existing Supabase SMTP quota restrictions remain; custom SMTP must be configured for customer-ready login. No auth bypass or fake OTP was introduced.
- Payment, GST and shipping business credentials/settings are not supplied. No money is charged or refunded by this increment.
- Mobile TypeScript/lint and web export are validated; physical Android/iOS device testing and store packaging are still required.
- Old browser-only products/promotions/orders are not migrated as real business records.
