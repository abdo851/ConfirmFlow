import type { AdLocale, AdPlacement, Advertisement } from "@/lib/ads/types";

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function visibleAdvertisements(
  rows: Advertisement[],
  placement: AdPlacement,
  locale: "ar" | "en",
): Advertisement[] {
  return rows
    .filter(
      (row) =>
        row.is_active &&
        row.placement === placement &&
        (row.locale === "both" || row.locale === locale),
    )
    .sort((left, right) => left.position - right.position || left.created_at.localeCompare(right.created_at));
}

export function isAdLocale(value: string): value is AdLocale {
  return value === "both" || value === "ar" || value === "en";
}
