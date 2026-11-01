# ElectroShop development

This repository now contains one main browser application in `frontend/`, built with JavaScript, esbuild and Supabase. The Expo and FastAPI prototypes were removed at the user's request.

Run `npm run check`, `npm run build`, and `npm test` from the root before delivery. Never bundle service-role keys. Keep server-side role/ownership checks and real authentication for protected operations. Do not replace live database operations with demo state.

The user requests that project changes be validated, committed and pushed to the original GitHub `main`, preserving upstream work and never force-pushing. Keep source, lockfiles and setup docs; exclude secrets, customer data, local databases and Site credentials.
