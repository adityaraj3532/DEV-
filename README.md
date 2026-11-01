# ElectroShop

The new electronics storefront is now the main application in `frontend/`. The previous Expo UI, FastAPI/SQLite prototype and browser-only demo have been removed. Their history remains in Git.

## Run on Windows

From the repository root:
```powershell
git pull origin main
npm run setup
npm run build
npm start
```
Open http://localhost:8080. Node.js and npm are required; Python and Expo are no longer needed. Stop any old server on port 8080 first and press Ctrl+Shift+R in the browser after updating.

- Customer: http://localhost:8080/
- Owner: http://localhost:8080/?portal=admin
- Delivery: http://localhost:8080/?portal=delivery

Products, accounts, profiles, orders, reviews, returns and uploaded photos use the existing Supabase project. Browser-only sample records are not imported. Owner: `adityaraj3532@gmail.com`. Real email verification is required for protected actions; guests can browse products.

**Email setup remains required:** Supabase's default email sender previously reached its quota. Configure custom SMTP in the project dashboard for reliable customer sign-in. Reconnecting the database does not reset that quota. You can verify an existing unexpired email link/code in the sign-in form.

Orders wait for owner confirmation before packing/delivery. Only cash on delivery is connected. Online payments, refunds and external courier integration remain unconnected.

See [database and email setup](frontend/supabase/README.md). Run `npm run check` and `npm test` to validate syntax, mocked email guards and live public/private API boundaries. Tests do not send emails.
