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
