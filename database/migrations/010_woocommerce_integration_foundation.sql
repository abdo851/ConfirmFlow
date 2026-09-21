-- Confirma — WooCommerce integration foundation (additive)
-- Mirror of supabase/migrations/20260921190000_woocommerce_integration_foundation.sql
-- Does NOT modify or delete Shopify or YouCan tables or data.

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_platform_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_platform_check
  CHECK (platform IN ('shopify', 'youcan', 'woocommerce'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_provider_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_provider_check
  CHECK (provider IN ('shopify', 'youcan', 'woocommerce'));

ALTER TABLE public.store_webhook_events DROP CONSTRAINT IF EXISTS store_webhook_events_provider_check;
ALTER TABLE public.store_webhook_events
  ADD CONSTRAINT store_webhook_events_provider_check
  CHECK (provider IN ('shopify', 'youcan', 'woocommerce'));

CREATE TABLE IF NOT EXISTS public.woocommerce_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  store_url TEXT NOT NULL,
  scope TEXT,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT woocommerce_connections_store_url_unique UNIQUE (store_url)
);

CREATE INDEX IF NOT EXISTS idx_woocommerce_connections_store_url
  ON public.woocommerce_connections(store_url);

CREATE TRIGGER woocommerce_connections_set_updated_at
  BEFORE UPDATE ON public.woocommerce_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.woocommerce_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.woocommerce_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_consumer_key TEXT NOT NULL,
  encrypted_consumer_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER woocommerce_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.woocommerce_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.woocommerce_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_connection_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY woocommerce_connections_select_own
  ON public.woocommerce_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_connections sc
      JOIN public.stores s ON s.id = sc.store_id
      WHERE sc.id = woocommerce_connections.store_connection_id
        AND s.owner_id = auth.uid()
    )
  );

-- Writes are service-role-only. Secrets have RLS enabled and no user policies.

GRANT SELECT ON public.woocommerce_connections TO authenticated;
