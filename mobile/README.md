# Dev Computer — Expo app

SDK 58 / React Native / Expo Router, with shared Supabase Auth, Database and Storage. Routes cover catalogue, product details, cart/COD checkout, account/addresses/orders/wishlist, offers and an owner product/inventory/order panel.

From repository root:
```powershell
npm run setup:mobile
npm run mobile
```
Use an SDK 58-compatible Expo Go or development client. To open React Native Web, run `npm run mobile:web`. This source does not include a signed Android APK or iOS application.

`npm run check:mobile` checks TypeScript and ESLint; `npm run build:mobile` exports the web bundle. Root README explains the separate web storefront/owner dashboard and feature parity.

The bundled configuration includes only the public project URL and publishable key. Role and stock checks run on the server. Guest cart data is local; signed-in customer data uses private RPCs. The session persists with AsyncStorage on native platforms. Checkout calls the deployed verified-user Edge Function and uses a retry key.

Photo upload uses Expo's system picker and image manipulator, then uploads a compressed JPEG to the owner's Storage prefix. Device permissions and camera/photo behavior still require physical-device testing.
