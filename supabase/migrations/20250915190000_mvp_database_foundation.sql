-- Confirma M2-C2 — MVP database foundation
-- Supersedes the M0 001_initial_schema.sql design for live deployment.
-- 001 remains as historical reference; apply 002 for the current MVP schema.
-- NEVER run destructive reset logic against production.

-- ---------------------------------------------------------------------------
-- Shared trigger: maintain updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles: application profile extension of auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile when a Supabase Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- stores: user-owned commerce stores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify')),
  external_store_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stores_owner_platform_external_unique
    UNIQUE (owner_id, platform, external_store_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);

CREATE TRIGGER stores_set_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- store_connections: generic integration connection per store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL
    CHECK (connection_type IN ('store', 'confirmation', 'marketing')),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'connecting', 'active', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_connections_store_type_provider_unique
    UNIQUE (store_id, connection_type, provider)
);

CREATE INDEX IF NOT EXISTS idx_store_connections_store_id
  ON public.store_connections(store_id);

CREATE TRIGGER store_connections_set_updated_at
  BEFORE UPDATE ON public.store_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shopify_connections: Shopify-specific public connection metadata
-- (no access tokens — those live in shopify_connection_secrets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_connections (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.store_connections(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  scope TEXT,
  connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shopify_connections_shop_domain_unique UNIQUE (shop_domain)
);

CREATE TRIGGER shopify_connections_set_updated_at
  BEFORE UPDATE ON public.shopify_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shopify_connection_secrets: server-only encrypted token storage
-- No user-facing RLS policies — accessible only via service role.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_connection_secrets (
  store_connection_id UUID PRIMARY KEY
    REFERENCES public.shopify_connections(store_connection_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shopify_connection_secrets_set_updated_at
  BEFORE UPDATE ON public.shopify_connection_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_connection_secrets ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- stores
CREATE POLICY stores_select_own
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY stores_insert_own
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY stores_update_own
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY stores_delete_own
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- store_connections (ownership via store)
CREATE POLICY store_connections_select_own
  ON public.store_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = store_connections.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY store_connections_insert_own
  ON public.store_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = store_connections.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY store_connections_update_own
  ON public.store_connections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = store_connections.store_id
        AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = store_connections.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY store_connections_delete_own
  ON public.store_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id = store_connections.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- shopify_connections (ownership via store_connections → stores)
CREATE POLICY shopify_connections_select_own
  ON public.shopify_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_connections sc
      JOIN public.stores s ON s.id = sc.store_id
      WHERE sc.id = shopify_connections.store_connection_id
        AND s.owner_id = auth.uid()
    )
  );

-- shopify_connections writes are service-role-only (OAuth callback server paths).
-- Users may read their own connection metadata but cannot insert/update/delete,
-- preventing cross-tenant shop_domain reservation attacks.

-- shopify_connection_secrets: RLS enabled, intentionally no user policies.
-- Service role bypasses RLS for server-side token read/write.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_connections TO authenticated;
GRANT SELECT ON public.shopify_connections TO authenticated;
