-- DO NOT APPLY UNTIL APPROVED
-- Order forwarding attempts. Not applied until approved.

CREATE TABLE public.order_forwarding_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('sent', 'failed', 'skipped', 'duplicate')),
  external_order_id TEXT,
  external_reference TEXT,
  http_status INTEGER,
  error_message TEXT,
  payload_summary JSONB,
  response_summary JSONB,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forward_owner_time
  ON public.order_forwarding_log (owner_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_forward_order
  ON public.order_forwarding_log (order_id, provider_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_forward_order_provider_success
  ON public.order_forwarding_log (order_id, provider_id)
  WHERE status = 'sent';

ALTER TABLE public.order_forwarding_log ENABLE ROW LEVEL SECURITY;

-- Client SELECT only. No INSERT, UPDATE, or DELETE policies. Writes are service-role only.
CREATE POLICY order_forwarding_log_select_own
  ON public.order_forwarding_log
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

REVOKE ALL ON TABLE public.order_forwarding_log FROM PUBLIC;
REVOKE ALL ON TABLE public.order_forwarding_log FROM anon;
REVOKE ALL ON TABLE public.order_forwarding_log FROM authenticated;
GRANT SELECT ON TABLE public.order_forwarding_log TO authenticated;
