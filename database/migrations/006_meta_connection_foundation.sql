-- Confirma M4-A — Meta connection foundation
-- Stores Meta Pixel/Dataset configuration and encrypted access tokens.
-- Does NOT create conversion event tables or CAPI dispatch logic.

-- ---------------------------------------------------------------------------
-- meta_connections: Meta-specific public connection metadata
-- (no access tokens — those live in meta_connection_secrets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meta_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meta_connections_pixel_id_unique UNIQUE (pixel_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_connections_pixel_id
  ON public.meta_connections(pixel_id);

CREATE TRIGGER meta_connections_set_updated_at
  BEFORE UPDATE ON public.meta_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- meta_connection_secrets: server-only encrypted token storage
-- No user-facing RLS policies — accessible only via service role.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meta_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.meta_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER meta_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.meta_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_connection_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY meta_connections_select_own
  ON public.meta_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_connections sc
      JOIN public.stores s ON s.id = sc.store_id
      WHERE sc.id = meta_connections.store_connection_id
        AND s.owner_id = auth.uid()
    )
  );

-- meta_connections writes are service-role-only.
-- meta_connection_secrets: RLS enabled, intentionally no user policies.

GRANT SELECT ON public.meta_connections TO authenticated;
