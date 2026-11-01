# Current verification

The Supabase-connected browser app is in `demo/` (the historical directory name is retained).

- Live database transaction tests passed for owner-only catalog changes, role checks, cross-customer order/address isolation, grouped cart totals, approval gates, delivery assignment, return requests, one-time stock restoration, and delivered-purchase-only reviews. Every test record was rolled back.
- Public publishable-key REST connection succeeded. Anonymous checkout and direct private-schema access were denied.
- Browser QA loaded the shared empty catalog and cart. Fake browser-local data was not imported.
- JavaScript bundle build and syntax checks passed.
- New tables have RLS, explicit deny policies, no direct frontend table grants, and a validated private RPC dispatcher. New schema had no security-advisor findings. A pre-existing INFO notice for the unrelated SAFE Route table remains unchanged.
- Real email delivery and real-user authenticated browser flows were not tested: user must complete email sign-in; custom SMTP and email template/redirect configuration may be needed.
- Supabase Storage bucket and ownership/verified-purchase upload policies are installed. Real-user photo upload was not tested in this turn because no authenticated user session was supplied.
- Online payment collection/refunds and external courier syncing remain unconnected. The connected server only accepts COD.

The legacy Expo/FastAPI code has not been integrated into this browser app. Earlier checks for that code passed and it was not changed in this update.

## Email limit handling update

Supabase logs confirmed 429 `over_email_send_rate_limit`. No server quota or SMTP credentials were changed. Login now offers verification without sending a new email, blocks duplicate/in-flight requests, rejects inactive demo emails locally, and persists a 60-second resend guard. Mock Auth tests passed without sending real emails; the browser showed both email-request and verification forms immediately. The app cooldown is not a claim that Supabase's server quota has reset. The remaining operational fix is custom SMTP / email-limit configuration in the project dashboard.
