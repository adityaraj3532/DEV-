# Dev Computer increment 1 verification

- Web JavaScript syntax, production bundle, email-send guard tests, promotion date rules and live public/private API checks passed.
- Expo SDK 58 TypeScript, ESLint and React Native Web export passed. The exported Expo app was opened in the browser: branded catalogue, all categories, protected owner route and login route rendered. Physical Android/iOS execution and store builds have not been tested.
- Browser web QA confirmed real Supabase snapshot loading, categories, empty catalogue state and protected sign-in UI. No real sign-in emails were sent; SMTP setup still blocks a full real-owner login test.
- `verify.sql` passed: role isolation, owner confirmation, server totals, deliveries, return eligibility/restocking, delivered-purchase reviews and profile privacy. All synthetic records rolled back.
- `verify-dev-computer.sql` passed: new categories, SKU/specifications, stock adjustments, stale-edit rejection, negative-stock prevention, promotions/drafts, checkout retry-key consistency, authoritative pricing, cancellation restock-once and audit entries. All synthetic records rolled back.
- The deployed JWT-protected checkout Edge Function rejects anonymous calls with HTTP 401. Authenticated checkout logic was tested through rollback SQL; no actual customer order or payment was created by QA.
- Supabase security advisor found no new shop findings. Existing unrelated SAFE Route RLS-without-policies INFO and disabled leaked-password-protection warning remain; password login was not introduced.
- Product/order changes use shared database state refreshed every 15 seconds and on foreground/focus; this is polling, not a claim of instantaneous Realtime synchronization.

Pending modules and platform parity are documented in FEATURES.md. No fake payment success, automatic discount engine or mock production inventory is claimed.
