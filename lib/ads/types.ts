export const adPlacements = [
  "overview",
  "orders",
  "connections",
  "shipping",
  "analytics",
  "tracking",
  "workflow",
  "wallet",
  "marketing",
  "global",
] as const;

export const adLocales = ["both", "ar", "en"] as const;

export type AdPlacement = (typeof adPlacements)[number];
export type AdLocale = (typeof adLocales)[number];

export interface Advertisement {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  locale: AdLocale;
  placement: AdPlacement;
  position: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvertisementInput {
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  locale: AdLocale;
  placement: AdPlacement;
  position?: number;
  is_active?: boolean;
}
