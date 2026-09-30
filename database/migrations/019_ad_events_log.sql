-- DO NOT APPLY UNTIL APPROVED

CREATE TABLE IF NOT EXISTS public.ad_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google')),
  event_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  http_status INTEGER,
  error_message TEXT,
  payload JSONB,
  response_summary JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_events_owner_sent ON public.ad_events_log(owner_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_events_owner_platform ON public.ad_events_log(owner_id, platform, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_events_order ON public.ad_events_log(order_id);

ALTER TABLE public.ad_events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_events_select_own ON public.ad_events_log
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies. Only service-role writes. Client reads own rows only.
