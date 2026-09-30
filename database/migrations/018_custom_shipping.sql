-- Proposed only. Do not apply this file until it is explicitly approved.
-- Merchants store their own webhook or API carrier connection.

CREATE TABLE IF NOT EXISTS public.custom_shipping_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('webhook', 'api')),
  webhook_url TEXT,
  hmac_secret_encrypted TEXT,
  api_base_url TEXT,
  api_key_encrypted TEXT,
  api_auth_type TEXT CHECK (api_auth_type IN ('bearer', 'x-api-key', 'basic')),
  create_shipment_path TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_shipping_owner ON public.custom_shipping_connections(owner_id);
CREATE INDEX IF NOT EXISTS idx_custom_shipping_status ON public.custom_shipping_connections(status);

ALTER TABLE public.custom_shipping_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_shipping_select_own ON public.custom_shipping_connections
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY custom_shipping_insert_own ON public.custom_shipping_connections
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY custom_shipping_update_own ON public.custom_shipping_connections
  FOR UPDATE TO authenticated USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY custom_shipping_delete_own ON public.custom_shipping_connections
  FOR DELETE TO authenticated USING (owner_id = auth.uid());
