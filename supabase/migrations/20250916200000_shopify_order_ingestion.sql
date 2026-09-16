-- Confirma M3-B — Shopify order ingestion and normalization
-- Adds provider-independent order persistence for verified webhook ingestion.
-- Does NOT create confirmation, conversion, or billing tables.

-- ---------------------------------------------------------------------------
-- orders: normalized store orders (no raw provider payload)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('shopify')),
  external_order_id TEXT NOT NULL,
  order_number TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  currency TEXT NOT NULL,
  subtotal_amount_minor BIGINT NOT NULL CHECK (subtotal_amount_minor >= 0),
  total_amount_minor BIGINT NOT NULL CHECK (total_amount_minor >= 0),
  financial_status TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (confirmation_status IN ('pending')),
  provider_created_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_store_provider_external_unique
    UNIQUE (store_id, provider, external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_received_at ON public.orders(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_status
  ON public.orders(confirmation_status);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Webhook ingestion writes via service role.
-- Store owners may read their own orders only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

GRANT SELECT ON public.orders TO authenticated;
