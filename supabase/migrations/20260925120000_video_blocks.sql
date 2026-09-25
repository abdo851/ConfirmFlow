-- Separate video placements. Does not alter content_blocks or existing tables.

CREATE TABLE IF NOT EXISTS public.video_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  placement TEXT NOT NULL CHECK (
    placement IN (
      'landing_hero',
      'landing_below_hero',
      'onboarding_top',
      'dashboard_top',
      'global'
    )
  ),
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_blocks_placement ON public.video_blocks (placement);
CREATE INDEX IF NOT EXISTS idx_video_blocks_is_active ON public.video_blocks (is_active);
CREATE INDEX IF NOT EXISTS idx_video_blocks_position ON public.video_blocks (position);

DROP TRIGGER IF EXISTS video_blocks_set_updated_at ON public.video_blocks;
CREATE TRIGGER video_blocks_set_updated_at
  BEFORE UPDATE ON public.video_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.video_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_blocks_select_public ON public.video_blocks;
CREATE POLICY video_blocks_select_public
  ON public.video_blocks
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

DROP POLICY IF EXISTS video_blocks_insert_admin ON public.video_blocks;
CREATE POLICY video_blocks_insert_admin
  ON public.video_blocks
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

DROP POLICY IF EXISTS video_blocks_update_admin ON public.video_blocks;
CREATE POLICY video_blocks_update_admin
  ON public.video_blocks
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

DROP POLICY IF EXISTS video_blocks_delete_admin ON public.video_blocks;
CREATE POLICY video_blocks_delete_admin
  ON public.video_blocks
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

GRANT SELECT ON public.video_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.video_blocks TO authenticated;
