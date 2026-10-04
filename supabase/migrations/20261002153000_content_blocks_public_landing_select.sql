-- Anonymous read of active landing Platform Content only.
-- Does not change authenticated policies or write grants.

GRANT SELECT ON public.content_blocks TO anon;

CREATE POLICY content_blocks_select_public_landing
  ON public.content_blocks
  FOR SELECT
  TO anon
  USING (
    is_active = TRUE
    AND type IN ('banner', 'ad')
    AND extra->>'placement' IN ('landing_hero', 'landing_below_hero')
  );
