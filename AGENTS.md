# Dev Computer development

The user requested Expo/React Native and Supabase again. `mobile/` is the SDK 58 Expo Router client; `frontend/` is the responsive connected web storefront/owner dashboard. Both use the isolated Supabase shop schema. See FEATURES.md for shipped/pending scope. Do not claim planned modules are implemented.

Before Expo changes, read the matching versioned documentation and use `npx expo install` for compatible packages. Use Expo Router for navigation. Keep reusable UI and data code outside route directories. Run mobile TypeScript, ESLint and export checks after native changes.

Run root `npm run check`, `npm run build`, `npm test`, and relevant mobile checks before delivery. Keep verified authentication and server-side role/ownership checks for real data. Never bundle service-role/payment secrets. Validate stock/order changes transactionally and preserve the owner-confirmation requirement. Do not touch unrelated SAFE Route records.

The user requests that project changes be validated, committed and pushed to the original GitHub main, preserving upstream work and never force-pushing. Exclude secrets, real customer data, dependencies and Site credentials.
