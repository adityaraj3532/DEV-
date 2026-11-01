# ElectroShop Supabase connection

Project: fdtbmtfcueyfdlwvtrkb (existing free-plan project, restored in this update).

The hosted browser app uses Supabase Auth, PostgreSQL RPC, and Storage directly. No service-role key is shipped to the browser. `src/supabase-config.json` contains only the intended public project URL and publishable key.

## Owner sign-in

The verified email `adityaraj3532@gmail.com` is the owner. Sign in with that email using the Owner portal. There are no demo login accounts or universal OTPs in the connected version.

Email sign-in uses Supabase Auth's existing project configuration. End-to-end email delivery has not been tested because no mailbox/SMTP credentials were supplied. Supabase's default email sender may restrict recipients. Configure custom SMTP in Supabase Auth before onboarding arbitrary customers.

For numeric OTP emails, update the Magic Link email template to include `{{ .Token }}`. Configure the Site URL and allowed redirects to the hosted site URL. The app also accepts a copied Supabase email verification link, verifying its token directly with this project's Auth service; this is useful when an existing project's redirect settings still point elsewhere. Never send OTPs, verification links, passwords, or SMTP secrets in chat.

## Data model and access

All new tables are in the non-exposed `electroshop` schema: products, orders, customers, reviews, returns, and roles. Existing tables (including SAFE Route data) are unchanged. Row-level security is enabled with explicit deny policies; direct anon/authenticated table access is revoked.

The exposed function `public.electroshop_api` is SECURITY INVOKER. It calls a strictly validated internal SECURITY DEFINER dispatcher in the private schema with an empty search path. Every protected action requires a valid `auth.uid()` and a verified Auth record. Owner/delivery roles are checked against a private role allowlist, never user metadata. The dispatcher calculates order prices, freezes return policies, locks inventory rows in stable order, and performs writes atomically.

Profiles, addresses, wishlist, saved items, and cart persist per signed-in account. Anonymous cart/wishlist data stays locally until sign-in and is merged into that account. Anonymous shoppers receive only the shared catalog and published reviews. Buyer email/order IDs are excluded from other shoppers' review payloads.

Owner approval is mandatory before delivery assignment or shipping. Delivery partners must first register/sign in with a verified email; the owner assigns that email in Manage delivery. Partners only receive their assigned, confirmed orders. Return eligibility uses the saved purchase policy and server delivery timestamp. Restocking happens once after the owner records receipt of an approved return.

`electroshop-media` is a public photo bucket. Public visibility is intentional for product and published review images. Uploads use unique filenames beneath the authenticated user's folder. Product uploads require the owner role; review uploads require a delivered purchase of the corresponding product. Storage limits images to JPEG/PNG/WebP and 1 MiB. Overwriting is not granted.

## Provisioning and checks

The schema was applied remotely via the Supabase migration tool. `electroshop.sql` and `rpc-only-policies.sql` retain the SQL source; do not rerun them on an already-provisioned project. `verify.sql` exercises authenticated roles, prices, approval gates, assignment, returns, reviews and privacy inside a transaction and rolls every test record back.

Verification completed:
- SQL assertions for owner-only changes, order ownership, approval gates, delivery access, server totals, delivered-review eligibility, returns and one-time stock restoration.
- Live public-key REST connection and anonymous catalog read.
- Unauthenticated checkout and direct private-schema access denied.
- Browser storefront loaded the live empty catalog.
- Supabase security advisor reported no new ElectroShop findings. One pre-existing INFO notice remains for the unrelated SAFE Route table's RLS-without-policy configuration; it was not changed.

Real online payments, refunds and external courier API integration remain unconnected. Only cash on delivery is accepted by the connected server. The original Expo app and legacy FastAPI/SQLite prototype have been removed. This Supabase-connected browser app is now the main frontend.

## Email rate-limit troubleshooting

Auth logs confirmed `429 over_email_send_rate_limit` during sign-in. The application now prevents duplicate/in-flight sends, adds a persistent 60-second resend guard, and always exposes verification of an already-received email without another send. This client-side guard does not reset or bypass Supabase's project email quota.

For the real fix, configure a production SMTP provider in the project's Authentication email settings, then review Authentication > Rate Limits. Default SMTP is limited and is not for a live customer shop. Keep email confirmation enabled. No SMTP credentials were supplied or changed by this update.

Official setup: https://supabase.com/docs/guides/auth/auth-smtp
