# Fix blockers report

## 1. Summary

The Inter font compile error is fixed and `/api/health` returns 200. The expired WooCommerce connection, its secrets, webhooks, and order #16 were removed. The new store is not connected yet. Meta is still verified and was not modified. It still sits on the old store record, so it will need to be re-linked after the new store is connected.

## 2. Font error

Root cause: `Inter` and `Cairo` already had `subsets` and `display: "swap"`. Turbopack failed while compiling `next/font/google` because the generated font request carried multiple weights plus preload and size-adjust fields. Turbopack requires that Google font query to be a single entry (`next/font/google queries have exactly one entry`).

Fix: keep both fonts on `next/font/google`, drop the explicit weight lists so the variable font is used, and set `preload: false` and `adjustFontFallback: false`. The `.next` cache was cleared and the dev server was restarted.

## 3. Next.js health after fix

HTTP 200. Body: `{"status":"ok","service":"confirma","milestone":"MVP"}`. `http://localhost:3000/ar` returned HTTP 200 HTML.

## 4. Old WooCommerce store deleted

The live connection was removed. `https://ancientcoach.s2-tastewp.com/wp-json/` redirects to `https://tastewp.com/` and is not a WooCommerce API.

Deleted:

- `woocommerce_connection_secrets` for `350c5c15-2c10-4a9e-b2c1-a7e033bc8309`
- `woocommerce_connections` row for `https://ancientcoach.s2-tastewp.com`
- WooCommerce `store_connections` row `350c5c15-2c10-4a9e-b2c1-a7e033bc8309`
- webhook events `a568917c-7f5d-4ef4-a148-addcf3af7ef7`, `544f7ae1-c830-46a4-9dcf-732a957d3df6`, `91c6854a-638c-43c2-a203-1481c074111b`
- order `40a907f9-4bbe-4003-8ddb-cf4f06761a75` (its Meta delivery row was removed by the existing foreign key)

The `stores` row `71e24709-75a4-4f11-8d85-9f31e783d747` was kept. `store_connections.store_id` uses `ON DELETE CASCADE`, and the verified Meta connection is on that same store. Deleting the store would have deleted Meta.

## 5. New store ready to connect

Yes. There are no `woocommerce_connections` rows. Connect from onboarding with `https://humorousdirt.s2-tastewp.com`. That creates a new store row. The old store record remains only so Meta is not cascade-deleted.

## 6. Meta connection status

Still `verified`. Pixel `4444157855871429`. Store connection `756f3d7e-4900-4472-bb9f-ee66c2d9fd1e`.

## 7. Meta re-link

Yes, after the new store exists. Meta's connection id is not the deleted WooCommerce connection. It is a marketing connection on store `71e24709-75a4-4f11-8d85-9f31e783d747`, whose external id is still `https://ancientcoach.s2-tastewp.com`. A new WooCommerce connect will use a different store id, so Purchase delivery for the new store will not see this Meta row until it is re-linked. It was not changed.

## 8. Next steps

1. Open http://localhost:3000/ar/onboarding/store?provider=woocommerce
2. Enter store URL `https://humorousdirt.s2-tastewp.com` and finish the WooCommerce connection.
3. Log in to https://humorousdirt.s2-tastewp.com/wp-admin as `abdo2` / `YCU46WFI9ow`.
4. Confirm WooCommerce is installed and active.
5. Set Settings → Permalinks to “Post name” and save.
6. Create a test product.
7. After Confirma is reconnected, create a new order in WooCommerce.
8. Confirm that order in the Confirma dashboard.
9. Watch https://eventsmanager.facebook.com/events_manager2/list/pixel/4444157855871429/test_events
10. Re-link the verified Meta connection to the new store before expecting a Purchase to send. That step was not done.

## 9. Tests

307/307 passed.

## 10. Typecheck

Pass. An existing prototype imported `gsap`, which is not installed. `types/gsap.d.ts` declares those modules so typecheck can pass without adding the package.

## 11. Files created / modified

Created:

- `scripts/reconnect-woocommerce.mjs`
- `types/gsap.d.ts`
- `FIX_BLOCKERS_REPORT.md`

Modified:

- `app/[locale]/layout.tsx`

## 12. Status

uncommitted, awaiting user approval
