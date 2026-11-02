# Browser-local mode

Supabase is disconnected at the application entry point. The build imports only `local-app.js`; Supabase client, configuration, endpoints and RPCs must not appear in the output. The remote database remains untouched. Local order confirmation, returns and verified-purchase review checks cover the active implementation. Portals do not require email or OTP.

## Delivery request and icon update

The active local app uses inline SVG icons instead of category/heart/star/gift emoji. Request tests cover owner confirmation, validated pins, accept/decline/withdraw, wrong assignee and stale request rejection, dispatch gating, location validation, bounded trails and terminal-status GPS rejection. Existing order/return/review/promotion tests remain passing. Browser QA created a local sample order, confirmed it, sent a request with map pins, accepted it as the delivery partner, and updated a labelled manual location. Real GPS permission was not requested in the remote QA browser. Supabase remains disconnected.

The street map rendered successfully using OpenFreeMap vector tiles through Leaflet Canvas (no WebGL requirement). A manual delivery position update propagated to an already-open customer tracking tab through the storage event. The initial raster provider and WebGL renderer were replaced after observed preview failures.
