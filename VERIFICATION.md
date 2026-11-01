# Browser-local mode

Supabase is disconnected at the application entry point. The build imports only `local-app.js`; Supabase client, configuration, endpoints and RPCs must not appear in the output. The remote database remains untouched. Local order confirmation, returns and verified-purchase review checks cover the active implementation. Portals do not require email or OTP.
