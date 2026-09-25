export const videoPlacements = [
  "landing_hero",
  "landing_below_hero",
  "onboarding_top",
  "dashboard_top",
  "global",
] as const;

export type VideoPlacement = (typeof videoPlacements)[number];

export interface VideoBlock {
  id: string;
  title: string | null;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  placement: VideoPlacement;
  position: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoInput {
  title?: string | null;
  description?: string | null;
  youtube_url: string;
  thumbnail_url?: string | null;
  placement: VideoPlacement;
  position?: number;
  is_active?: boolean;
}
