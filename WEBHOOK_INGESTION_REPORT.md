# WooCommerce webhook ingestion

## Summary

WooCommerce can now register `order.created` and `order.updated` webhooks after connect, verify the `X-WC-Webhook-Signature` HMAC, normalize the order, and upsert it into `orders`. New rows start as `pending`. Later updates refresh order fields and leave `confirmation_status` unchanged, so the existing confirm flow can still move an order to `confirmed` and send Meta. The dashboard orders list already reads every order for the signed-in owner, so ingested WooCommerce orders appear there without a separate screen.

## Flow

1. The callback saves the store connection, then generates a 32-byte hex webhook secret, encrypts it into `woocommerce_connection_secrets.encrypted_webhook_secret`, and POSTs two webhooks to `{store}/wp-json/wc/v3/webhooks`.
2. Delivery URL: `{NEXT_PUBLIC_APP_URL}/api/integrations/woocommerce/webhooks?connection={store_connection_id}`.
3. WooCommerce signs the raw body with HMAC-SHA256 and sends it as base64 in `X-WC-Webhook-Signature`.
4. The public POST route verifies the signature, skips duplicate `X-WC-Webhook-Delivery-ID` values, and upserts `order.created` / `order.updated`. Other topics are stored as `unsupported`.
5. Disconnect deletes those webhook ids on the store first, then removes the local rows. Registration and cleanup failures are logged and do not block connect or disconnect.

## Files

Created:

- `database/migrations/011_woocommerce_webhook_secret.sql`
- `supabase/migrations/20260922100000_woocommerce_webhook_secret.sql`
- `lib/integrations/woocommerce/webhooks/register.ts`
- `lib/integrations/woocommerce/webhooks/unregister.ts`
- `lib/integrations/woocommerce/webhooks/hmac.ts`
- `lib/integrations/woocommerce/webhooks/headers.ts`
- `lib/integrations/woocommerce/webhooks/ingest.ts`
- `lib/integrations/woocommerce/webhooks/cleanup.ts`
- `lib/integrations/woocommerce/orders/schema.ts`
- `lib/integrations/woocommerce/orders/normalize.ts`
- `lib/integrations/woocommerce/orders/persist.ts`
- `app/api/integrations/woocommerce/webhooks/route.ts`
- `tests/fixtures/woocommerce-order.ts`
- `tests/unit/woocommerce-webhook-hmac.test.ts`
- `tests/unit/woocommerce-order-normalize.test.ts`
- `tests/unit/woocommerce-webhook-receiver.test.ts`

Modified:

- `app/api/integrations/woocommerce/callback/route.ts`
- `app/api/integrations/woocommerce/disconnect/route.ts`
- `lib/integrations/woocommerce/persistence.ts`
- `middleware.ts`
- `lib/orders/types.ts`
- `lib/webhooks/ingestion/types.ts`
- `database/types/index.ts`

`OrderProvider` and `WebhookProvider` now include `woocommerce` so ingested rows type-check. YouCan, Shopify, and Meta modules were not edited.

## Tests

Unit coverage checks the HMAC, normalization (including a missing total), invalid signatures, first-time pending insert, duplicate delivery ids, and an update that keeps `confirmation_status`.

## How to test end to end

1. Apply migration 011 (`supabase db push` or the SQL in `database/migrations/011_woocommerce_webhook_secret.sql`).
2. Disconnect and connect the WooCommerce store again so Confirma registers the two webhooks. An already connected store does not register them until the callback runs again.
3. Place or update an order on the store.
4. Open `/en/dashboard/orders`. The order should appear as pending. Confirming it still uses the existing confirmation action.

## Commit

`feat(woocommerce): add webhook registration, order ingestion, and normalization`

## Limitations

- Migration 011 is in the repo and is not applied by this change. Until it is applied, webhook secret storage fails and connect still succeeds, but deliveries cannot be verified.
- Reconnecting replaces the local webhook secret and deletes previously stored webhook ids before creating new ones. Webhooks created outside those ids are left on the store.
- Amounts use `Math.round(Number(total) * 100)`. Zero-decimal currencies are not special-cased.
- Both subtotal and total use WooCommerce `order.total`, because the webhook task specifies that field for both.
- Dashboard display reuses the existing orders query. There is no separate WooCommerce column.
