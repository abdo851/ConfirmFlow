-- Confirma M4-D / M4-F — Meta Purchase delivery records
-- Durable, idempotent Purchase delivery state for Meta CAPI.
-- Does NOT store access tokens, raw Meta responses, or sensitive user data.

-- Enforce composite order identity for delivery integrity (M4-F).
ALTER TABLE public.orders
  ADD CONSTRAINT orders_id_store_id_unique UNIQUE (id, store_id);

CREATE TABLE IF NOT EXISTS public.meta_conversion_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  order_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('meta')),
  event_type TEXT NOT NULL CHECK (event_type IN ('Purchase')),
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meta_conversion_deliveries_order_store_fkey
    FOREIGN KEY (order_id, store_id)
    REFERENCES public.orders(id, store_id) ON DELETE CASCADE,
  CONSTRAINT meta_conversion_deliveries_event_id_unique UNIQUE (event_id),
  CONSTRAINT meta_conversion_deliveries_order_provider_event_unique
    UNIQUE (order_id, provider, event_type)
);

CREATE INDEX IF NOT EXISTS idx_meta_conversion_deliveries_store_id
  ON public.meta_conversion_deliveries(store_id);

CREATE INDEX IF NOT EXISTS idx_meta_conversion_deliveries_order_id
  ON public.meta_conversion_deliveries(order_id);

CREATE INDEX IF NOT EXISTS idx_meta_conversion_deliveries_status
  ON public.meta_conversion_deliveries(status);

CREATE TRIGGER meta_conversion_deliveries_set_updated_at
  BEFORE UPDATE ON public.meta_conversion_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.meta_conversion_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY meta_conversion_deliveries_select_own
  ON public.meta_conversion_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = meta_conversion_deliveries.store_id
        AND s.owner_id = auth.uid()
    )
  );

GRANT SELECT ON public.meta_conversion_deliveries TO authenticated;
