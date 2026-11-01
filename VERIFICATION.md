# Main application migration

The connected browser application was moved from `demo/` to `frontend/`. Legacy Expo and FastAPI/SQLite files and the local preview application were removed. Root npm scripts now install, build, validate and serve the single application. Existing Supabase records and schema were preserved; sample browser records are not imported.

Validation: JavaScript syntax and production build passed; email guard mock checks passed. Live RPC access checks passed: public catalog reachable, private records hidden, anonymous checkout and direct table access denied. Root server returned HTTP 200 for customer, owner and app bundle URLs. No real sign-in emails were sent. Real user login still depends on Supabase SMTP/email quota configuration. Online payments remain unconnected.
