# Meta integration report

Status: **stopped before Purchase delivery — verification_status is not verified. Uncommitted.**

## 1. Summary

`META_SESSION_SECRET` was already present in `.env.local`, so nothing else in that file was changed. The connect script stored an encrypted Meta token for the WooCommerce store and asked Meta to confirm the pixel. Graph `/me` accepted the token. Reading the pixel returned HTTP 400 `(#100) Missing Permission`, so the saved status is `credentials_valid`, not `verified`. Delivery was not retried. The dashboard UI, unit tests, and typecheck were not started, because a non-verified status is a stop.

## 2. Pixel connected

Partly. A marketing connection row exists and the token is encrypted in `meta_connection_secrets`. The store connection was left at `connecting`. It was not switched to `active`, because delivery only runs for an active, verified connection.

- Store: `https://ancientcoach.s2-tastewp.com`
- Store id: `71e24709-75a4-4f11-8d85-9f31e783d747`
- Store connection id: `8672aafc-8b26-4b2d-ba85-b0ac1cb893a1`

## 3. Verification status

`credentials_valid`

Meta message: `(#100) Missing Permission` (HTTP 400 on the pixel read). The token is a live user token, and this app user cannot read pixel `4444157855871429`. Purchase delivery requires `verified`.

## 4. Order #16 delivery status

Not sent. The pending `meta_conversion_deliveries` row was not retried.

## 5. Files created

- `scripts/meta-script-lib.mjs`
- `scripts/connect-meta.mjs`
- `META_INTEGRATION_REPORT.md`

## 6. Files modified

None. `.env.local` already contained `META_SESSION_SECRET`.

## 7. Tests

Not run. Stopped after verification.

## 8. Typecheck

Not run. Stopped after verification.

## 9. How to verify in Meta Test Events

No Purchase event was sent. After the token can read this pixel, open:

https://eventsmanager.facebook.com/events_manager2/list/pixel/4444157855871429/test_events

## 10. Status

Stopped, uncommitted, awaiting user approval. The token needs permission to read this pixel (typically `ads_management` or `ads_read` on the pixel’s ad account, issued for the same Meta app). Then rerun `node scripts/connect-meta.mjs` with `META_PIXEL_ID` and `META_ACCESS_TOKEN` set in the process environment, not in the script.

## 11. Known limitations

- The script classifies HTTP 400 like the existing verifier: anything other than 200, 403, or 404 becomes `credentials_valid`.
- The access token was passed only through the process environment. It is not in source files and is not repeated here.
- YouCan, Shopify, and WooCommerce integration code, and migrations, were not modified.
