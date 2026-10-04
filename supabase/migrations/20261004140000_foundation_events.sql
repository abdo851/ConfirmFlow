-- DO NOT APPLY UNTIL APPROVED
-- General event log and routing rules. Not specific to any provider.

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ORDER_CONFIRMED', 'ORDER_DELIVERED', 'ORDER_CANCELLED')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'cod_network_seller', 'cod_network_affiliate', 'service_b', 'service_c')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_owner_order_type_unique UNIQUE (owner_id, order_id, type)
);

CREATE INDEX events_owner_occurred_idx ON public.events (owner_id, occurred_at DESC);
CREATE INDEX events_order_id_idx ON public.events (order_id);
CREATE INDEX events_type_idx ON public.events (type);

CREATE TABLE public.routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORDER_CONFIRMED', 'ORDER_DELIVERED', 'ORDER_CANCELLED')),
  destination TEXT NOT NULL CHECK (destination IN ('meta', 'tiktok', 'google')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routing_rules_owner_event_destination_unique UNIQUE (owner_id, event_type, destination)
);

CREATE INDEX routing_rules_owner_event_type_idx ON public.routing_rules (owner_id, event_type);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

-- Client SELECT only. No INSERT, UPDATE, or DELETE policies. Writes are service-role only.
CREATE POLICY events_select_own
  ON public.events
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY routing_rules_select_own
  ON public.routing_rules
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

REVOKE ALL ON TABLE public.events FROM PUBLIC;
REVOKE ALL ON TABLE public.events FROM anon;
REVOKE ALL ON TABLE public.events FROM authenticated;
GRANT SELECT ON TABLE public.events TO authenticated;

REVOKE ALL ON TABLE public.routing_rules FROM PUBLIC;
REVOKE ALL ON TABLE public.routing_rules FROM anon;
REVOKE ALL ON TABLE public.routing_rules FROM authenticated;
GRANT SELECT ON TABLE public.routing_rules TO authenticated;
