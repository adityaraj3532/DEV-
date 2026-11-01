## Temporary direct portal access

The default UI now opens a browser-only preview without email or OTP:
- Customer: `http://localhost:8080/`
- Owner: `http://localhost:8080/?portal=admin`
- Delivery: `http://localhost:8080/?portal=delivery`

All preview inventory, photos, profiles and orders are sample/browser-local data, shared between portals on the same browser and origin. Use sample personal details. Nothing is sent to Supabase and no real payments are processed. Supabase is disconnected for every URL, including `?mode=live`. The built app contains no Supabase client or project configuration. Integration source and SQL are retained for later reconnection; existing remote data is untouched. This applies to `demo/`, not the older Expo frontend.

Run from `demo/`:
```powershell
npm ci
npm run build
python -m http.server 8080 --directory dist
```

# ElectroShop connected browser app

This is the Supabase-connected source for the private ElectroShop site. Data is now shared through Supabase instead of the browser-only demonstration state.

## Build

```sh
npm ci
node build.mjs
```

Serve `dist/` with a static server. Edit `src/`, then rebuild. The public project configuration is in `src/supabase-config.json`. Never add a service-role key.

See [supabase/README.md](supabase/README.md) for the database, real email sign-in, owner account, delivery assignment, Storage policies, tests and operational limits. Email delivery still needs SMTP configuration/testing for arbitrary customer addresses.

Old fake orders, test reviews and demo accounts were not imported into Supabase. The owner can add actual shop inventory after signing in. Real online payments and refunds are not enabled.
