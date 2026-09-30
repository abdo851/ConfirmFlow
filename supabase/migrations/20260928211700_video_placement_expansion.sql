-- Expand video_blocks.placement to include dashboard section placements.
-- Does not drop rows. Existing landing and dashboard placements stay valid.

ALTER TABLE public.video_blocks DROP CONSTRAINT IF EXISTS video_blocks_placement_check;

ALTER TABLE public.video_blocks
  ADD CONSTRAINT video_blocks_placement_check
  CHECK (
    placement IN (
      'landing_hero',
      'landing_below_hero',
      'onboarding_top',
      'dashboard_top',
      'global',
      'overview',
      'orders',
      'analytics',
      'connections',
      'shipping',
      'tracking',
      'marketing',
      'wallet',
      'workflow'
    )
  );
