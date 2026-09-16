-- Confirma M3-A — Shopify webhook ingestion foundation
-- Adds persistent idempotency/event records for inbound store webhooks.
-- Does NOT create orders, conversions, or confirmation tables.

-- ---------------------------------------------------------------------------
-- store_webhook_events: provider webhook ingestion records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('shopify')),
  external_event_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  shop_domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('accepted', 'ignored', 'unsupported', 'duplicate', 'rejected')
  ),
  payload_hash TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_webhook_events_store_provider_external_unique
    UNIQUE (store_id, provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_store_webhook_events_store_id
  ON public.store_webhook_events(store_id);

CREATE INDEX IF NOT EXISTS idx_store_webhook_events_received_at
  ON public.store_webhook_events(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_webhook_events_provider_topic
  ON public.store_webhook_events(provider, topic);

CREATE TRIGGER store_webhook_events_set_updated_at
  BEFORE UPDATE ON public.store_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Webhook ingestion is server-to-server via service role.
-- No authenticated client access in M3-A.
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_webhook_events ENABLE ROW LEVEL SECURITY;
