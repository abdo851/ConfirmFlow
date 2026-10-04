-- Customer-facing advertisements with a placement, separate from video_blocks and content_blocks.

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  locale TEXT NOT NULL DEFAULT 'both' CHECK (locale IN ('both', 'ar', 'en')),
  placement TEXT NOT NULL CHECK (
    placement IN (
      'overview',
      'orders',
      'connections',
      'shipping',
      'analytics',
      'tracking',
      'workflow',
      'wallet',
      'marketing',
      'global'
    )
  ),
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_placement ON public.advertisements (placement);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON public.advertisements (is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON public.advertisements (position);

DROP TRIGGER IF EXISTS advertisements_set_updated_at ON public.advertisements;
CREATE TRIGGER advertisements_set_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advertisements_select_public ON public.advertisements;
CREATE POLICY advertisements_select_public
  ON public.advertisements
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS advertisements_insert_admin ON public.advertisements;
CREATE POLICY advertisements_insert_admin
  ON public.advertisements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS advertisements_update_admin ON public.advertisements;
CREATE POLICY advertisements_update_admin
  ON public.advertisements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS advertisements_delete_admin ON public.advertisements;
CREATE POLICY advertisements_delete_admin
  ON public.advertisements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

GRANT SELECT ON public.advertisements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.advertisements TO authenticated;
