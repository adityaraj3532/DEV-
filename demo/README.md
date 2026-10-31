# ElectroShop interactive demo

Latest private demo: https://electroshop-aditya-demo.adityaraj3532.chatgpt.site

## Run locally

From this folder, run `cd dist` then `python -m http.server 8080`.
Open http://localhost:8080. Use the portal links in the header.
Demo OTP: `123456`. Owner: `owner@demo.com`. Delivery partner: `delivery@demo.com`.
These are simulated logins, never production authentication.

## Included

Category/brand/price filters; product photos; stock controls; wishlist; saved-for-later; persistent cart; profiles and saved addresses; owner approval before delivery; delivery assignment, status and tracking; configurable return policies and return requests; delivered-purchase reviews with ratings, text, and photo uploads.

Confirmation uses an on-page step, avoiding browser popup dependence. Return eligibility is frozen at checkout. Only delivered buyers can request eligible returns and review products. Return stock is restored once, when the owner receives the item.

## Current boundaries

Data is browser-local. Different browsers do not yet share orders or reviews. Online payments are explicitly simulated: no real money is charged or refunded. Real email OTP and external courier syncing are not connected here.

Supabase is NOT connected yet. The only existing account project is paused; the user still needs to choose whether to resume it or create a separate ElectroShop project. No Supabase schema changes were made.

The original Expo screens, FastAPI backend, and this prototype are separate. The backend implements a baseline SQLite/API flow, not every feature in this demo. The Expo screens still use local demo data.

## Checks

Run from this folder:

```sh
node --check dist/app.js
node checks/confirmation.cjs
node checks/returns-reviews.cjs
```

Browser QA also verified profiles/address autofill, cart/wishlist, simulated payments, delivery updates, owner confirmation, returns, and reviews with a real sample image upload.
