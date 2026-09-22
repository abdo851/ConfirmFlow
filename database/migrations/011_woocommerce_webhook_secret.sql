-- Confirma — WooCommerce webhook secret and registered webhook ids.
-- Additive only. Does not change Shopify or YouCan tables.

ALTER TABLE public.woocommerce_connection_secrets
  ADD COLUMN IF NOT EXISTS encrypted_webhook_secret TEXT NOT NULL DEFAULT '';

ALTER TABLE public.woocommerce_connections
  ADD COLUMN IF NOT EXISTS webhook_ids TEXT[] DEFAULT '{}';
