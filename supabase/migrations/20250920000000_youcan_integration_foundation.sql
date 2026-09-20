-- Confirma — YouCan integration foundation (additive)
-- Extends platform/provider constraints and adds YouCan connection tables.
-- Does NOT modify or delete Shopify tables or data.

-- ---------------------------------------------------------------------------
-- Extend platform/provider CHECK constraints for YouCan
-- ---------------------------------------------------------------------------
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_platform_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_platform_check
  CHECK (platform IN ('shopify', 'youcan'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_provider_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_provider_check
  CHECK (provider IN ('shopify', 'youcan'));

ALTER TABLE public.store_webhook_events DROP CONSTRAINT IF EXISTS store_webhook_events_provider_check;
ALTER TABLE public.store_webhook_events
  ADD CONSTRAINT store_webhook_events_provider_check
  CHECK (provider IN ('shopify', 'youcan'));

-- ---------------------------------------------------------------------------
-- youcan_connections: YouCan-specific public connection metadata
-- (no access tokens — those live in youcan_connection_secrets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youcan_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  store_slug TEXT NOT NULL,
  youcan_store_id TEXT,
  scope TEXT,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT youcan_connections_store_slug_unique UNIQUE (store_slug)
);

CREATE INDEX IF NOT EXISTS idx_youcan_connections_youcan_store_id
  ON public.youcan_connections(youcan_store_id);

CREATE TRIGGER youcan_connections_set_updated_at
  BEFORE UPDATE ON public.youcan_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- youcan_connection_secrets: server-only encrypted token storage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youcan_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.youcan_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER youcan_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.youcan_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (mirrors Shopify pattern)
-- ---------------------------------------------------------------------------
ALTER TABLE public.youcan_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youcan_connection_secrets ENABLE ROW LEVEL SECURITY;
