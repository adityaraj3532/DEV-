# Dev Computer database

Supabase is reconnected. The existing isolated `electroshop` schema and media bucket are retained. `dev-computer-upgrade.sql` and `dev-computer-checkout.sql` were applied to the existing schema after the initial `electroshop.sql` and explicit RPC-only policies. Do not rerun the initial creation script against an already provisioned database.

The public `dev_computer_api` is an invoker wrapper around the private dispatcher. The checkout Edge Function requires a verified user JWT. Product updates require `expected_stock`; additive inventory updates lock the product row. Checkout retry keys are scoped to the user, reject different payload reuse, and are recorded in the same transaction as stock reservation. Audit logs and checkout request records are private and RLS-protected. No service-role key is bundled in clients.

Run `verify.sql` and `verify-dev-computer.sql` in a rollback transaction to validate permissions and flows. Both were executed successfully. Synthetic Auth records and test data are rolled back.

SMTP remains required for reliable customer login: https://supabase.com/dashboard/project/fdtbmtfcueyfdlwvtrkb/auth/smtp . Configure an email provider and allow the hosted URL plus local web origin in Auth redirect settings. For numeric email codes, include `{{ .Token }}` in the email template. Never share SMTP secrets or OTPs in chat.
