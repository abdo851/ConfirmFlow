-- DO NOT APPLY UNTIL APPROVED
-- COD Network seller connection and inbound webhook log. Not applied until approved.

CREATE TABLE public.cod_network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  api_token_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'invalid', 'disconnected')),
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cod_network_connections_owner_unique UNIQUE (owner_id)
);

CREATE INDEX cod_network_connections_owner_id_idx ON public.cod_network_connections (owner_id);

CREATE TABLE public.cod_network_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.cod_network_connections(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('lead_status', 'order_status')),
  external_id TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cod_network_webhook_events_idempotency UNIQUE (connection_id, event_type, external_id)
);

CREATE INDEX cod_network_webhook_events_connection_created_idx
  ON public.cod_network_webhook_events (connection_id, created_at DESC);

ALTER TABLE public.cod_network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cod_network_webhook_events ENABLE ROW LEVEL SECURITY;

-- Client SELECT only. No INSERT, UPDATE, or DELETE policies. Writes are service-role only.
-- Only the webhook route inserts into public.cod_network_webhook_events.
CREATE POLICY cod_network_connections_select_own
  ON public.cod_network_connections
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY cod_network_webhook_events_select_own
  ON public.cod_network_webhook_events
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

REVOKE ALL ON TABLE public.cod_network_connections FROM PUBLIC;
REVOKE ALL ON TABLE public.cod_network_connections FROM anon;
REVOKE ALL ON TABLE public.cod_network_connections FROM authenticated;
GRANT SELECT ON TABLE public.cod_network_connections TO authenticated;

REVOKE ALL ON TABLE public.cod_network_webhook_events FROM PUBLIC;
REVOKE ALL ON TABLE public.cod_network_webhook_events FROM anon;
REVOKE ALL ON TABLE public.cod_network_webhook_events FROM authenticated;
GRANT SELECT ON TABLE public.cod_network_webhook_events TO authenticated;
