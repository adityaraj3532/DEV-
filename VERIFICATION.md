# Browser-local mode

Supabase is disconnected at the application entry point. The build imports only `local-app.js`; Supabase client, configuration, endpoints and RPCs must not appear in the output. The remote database remains untouched. Local order confirmation, returns and verified-purchase review checks cover the active implementation. Portals do not require email or OTP.

## Delivery request and icon update

The active local app uses inline SVG icons instead of category/heart/star/gift emoji. Request tests cover owner confirmation, validated pins, accept/decline/withdraw, wrong assignee and stale request rejection, dispatch gating, location validation, bounded trails and terminal-status GPS rejection. Existing order/return/review/promotion tests remain passing. Browser QA created a local sample order, confirmed it, sent a request with map pins, accepted it as the delivery partner, and updated a labelled manual location. Real GPS permission was not requested in the remote QA browser. Supabase remains disconnected.

The street map rendered successfully using OpenFreeMap vector tiles through Leaflet Canvas (no WebGL requirement). A manual delivery position update propagated to an already-open customer tracking tab through the storage event. The initial raster provider and WebGL renderer were replaced after observed preview failures.

## Dev Computer dark redesign

Branding changed to Dev Computer. The reference-inspired mobile storefront uses a dark forest background, lime inline SVG icons, promotional hero artwork, six compact categories, two-column product cards and a fixed five-action bottom navigation. Desktop and owner/delivery screens use the same palette. Product photos supplied by the owner take priority over generic local SVG illustrations. No discount percentages, crossed-out prices or return policies were invented to match the sample image.

Browser QA covered the desktop storefront, a 360px mobile preview, wishlist toggle, quick-add/cart navigation and owner promotion form. Existing order, return/review, offer and delivery tests pass. Supabase remains disconnected and the existing browser storage key/data are preserved.

## Search, cart feedback and receipts

Passed root check/build/test, including receipt totals, completion gating and escaping checks. Browser QA verified camera search hides banners/categories and clearing restores them, add changes to an added tick/count, and a sample COD order proceeds through owner confirmation and delivery to the receipt view with snapshot totals and download/print controls. Receipt is generated only after Delivered, with no unverified paid or GST claims.

## Repair Centre, quantity buttons and locations

Browser QA submitted an item photo/problem, verified a unique REP ID, updated the repair as owner to Ready for pickup with a ₹499 price and custom collection message, then verified both messages and price in the customer portal. Quick add displays quantity and toast computes fixed bottom:100px. Photon area lookup returned Mansarovar results and selection succeeded with hidden coordinate inputs. GPS permission was not requested. Unit tests cover repair validation, owner-only updates, price checks and ready-message deduplication. All existing suites passed.

## Custom categories and icon contrast

Browser QA created Monitors, opened Add item with Monitors preselected, and saved QA Display 24 at ₹9,999 with stock 3. The custom category appeared in the customer catalogue. Selected Camera SVG computed dark rgb(23,36,17) on lime rgb(199,255,151), resolving the inherited lime-on-lime icon issue. Root check/build/test passed.
