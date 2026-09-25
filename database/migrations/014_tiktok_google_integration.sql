-- Confirma — TikTok Events API + Google Ads Enhanced Conversions scaffolding.
-- New tables only. Does not modify meta_conversion_deliveries or existing rows.

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_platform_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_platform_check
  CHECK (platform IN ('shopify', 'youcan', 'woocommerce', 'tiktok', 'google'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_provider_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_provider_check
  CHECK (provider IN ('shopify', 'youcan', 'woocommerce', 'tiktok', 'google'));

ALTER TABLE public.store_webhook_events DROP CONSTRAINT IF EXISTS store_webhook_events_provider_check;
ALTER TABLE public.store_webhook_events
  ADD CONSTRAINT store_webhook_events_provider_check
  CHECK (provider IN ('shopify', 'youcan', 'woocommerce', 'tiktok', 'google'));

-- ---------------------------------------------------------------------------
-- tiktok_connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiktok_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  pixel_code TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN (
      'unverified',
      'verified',
      'credentials_valid',
      'identifier_not_verified',
      'failed'
    )),
  verified_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tiktok_connections_pixel_code_unique UNIQUE (pixel_code)
);

CREATE INDEX IF NOT EXISTS idx_tiktok_connections_pixel_code
  ON public.tiktok_connections(pixel_code);

CREATE INDEX IF NOT EXISTS idx_tiktok_connections_verification_status
  ON public.tiktok_connections(verification_status);

CREATE TRIGGER tiktok_connections_set_updated_at
  BEFORE UPDATE ON public.tiktok_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tiktok_connection_secrets (service role only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiktok_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.tiktok_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tiktok_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.tiktok_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tiktok_conversion_deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiktok_conversion_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Purchase' CHECK (event_type = 'Purchase'),
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tiktok_conversion_deliveries_event_id_unique UNIQUE (event_id),
  CONSTRAINT tiktok_conversion_deliveries_order_event_unique UNIQUE (order_id, event_type),
  CONSTRAINT tiktok_conversion_deliveries_order_store_fkey
    FOREIGN KEY (order_id, store_id)
    REFERENCES public.orders(id, store_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tiktok_conversion_deliveries_store_id
  ON public.tiktok_conversion_deliveries(store_id);

CREATE INDEX IF NOT EXISTS idx_tiktok_conversion_deliveries_order_id
  ON public.tiktok_conversion_deliveries(order_id);

CREATE INDEX IF NOT EXISTS idx_tiktok_conversion_deliveries_status
  ON public.tiktok_conversion_deliveries(status);

CREATE TRIGGER tiktok_conversion_deliveries_set_updated_at
  BEFORE UPDATE ON public.tiktok_conversion_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- google_connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  conversion_id TEXT NOT NULL,
  conversion_label TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN (
      'unverified',
      'verified',
      'credentials_valid',
      'identifier_not_verified',
      'failed'
    )),
  verified_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_connections_conversion_id_unique UNIQUE (conversion_id)
);

CREATE INDEX IF NOT EXISTS idx_google_connections_conversion_id
  ON public.google_connections(conversion_id);

CREATE INDEX IF NOT EXISTS idx_google_connections_verification_status
  ON public.google_connections(verification_status);

CREATE TRIGGER google_connections_set_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- google_connection_secrets (service role only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.google_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER google_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.google_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- google_conversion_deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_conversion_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Purchase' CHECK (event_type = 'Purchase'),
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_conversion_deliveries_event_id_unique UNIQUE (event_id),
  CONSTRAINT google_conversion_deliveries_order_event_unique UNIQUE (order_id, event_type),
  CONSTRAINT google_conversion_deliveries_order_store_fkey
    FOREIGN KEY (order_id, store_id)
    REFERENCES public.orders(id, store_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_google_conversion_deliveries_store_id
  ON public.google_conversion_deliveries(store_id);

CREATE INDEX IF NOT EXISTS idx_google_conversion_deliveries_order_id
  ON public.google_conversion_deliveries(order_id);

CREATE INDEX IF NOT EXISTS idx_google_conversion_deliveries_status
  ON public.google_conversion_deliveries(status);

CREATE TRIGGER google_conversion_deliveries_set_updated_at
  BEFORE UPDATE ON public.google_conversion_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.tiktok_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_connection_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_conversion_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connection_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_conversion_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY tiktok_connections_select_own
  ON public.tiktok_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_connections sc
      JOIN public.stores s ON s.id = sc.store_id
      WHERE sc.id = tiktok_connections.store_connection_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY tiktok_conversion_deliveries_select_own
  ON public.tiktok_conversion_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = tiktok_conversion_deliveries.store_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY google_connections_select_own
  ON public.google_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_connections sc
      JOIN public.stores s ON s.id = sc.store_id
      WHERE sc.id = google_connections.store_connection_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY google_conversion_deliveries_select_own
  ON public.google_conversion_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = google_conversion_deliveries.store_id
        AND s.owner_id = auth.uid()
    )
  );

-- Secrets tables: RLS on, no user policies. Service role writes only.
-- Connection and delivery writes are service-role-only.

GRANT SELECT ON public.tiktok_connections TO authenticated;
GRANT SELECT ON public.tiktok_conversion_deliveries TO authenticated;
GRANT SELECT ON public.google_connections TO authenticated;
GRANT SELECT ON public.google_conversion_deliveries TO authenticated;
