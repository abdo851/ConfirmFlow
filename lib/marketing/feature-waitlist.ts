import "server-only";

import { createDatabaseClient } from "@/lib/database/client";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const featureWaitlistKeys = [
  "gtm",
  "tiktok",
  "campaigns",
  "audiences",
  "templates",
  "team",
] as const;

export type FeatureWaitlistKey = (typeof featureWaitlistKeys)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseFeatureWaitlist(input: {
  feature: string;
  email: string;
}): { ok: true; feature: FeatureWaitlistKey; email: string } | { ok: false } {
  const feature = input.feature.trim();
  const email = input.email.trim().toLowerCase();
  if (!featureWaitlistKeys.includes(feature as FeatureWaitlistKey)) {
    return { ok: false };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false };
  }
  return { ok: true, feature: feature as FeatureWaitlistKey, email };
}

export async function saveFeatureWaitlist(feature: FeatureWaitlistKey, email: string): Promise<boolean> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return false;
  }

  const db = createDatabaseClient();
  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "feature_waitlist")
    .maybeSingle();

  const current =
    data?.value && typeof data.value === "object" && !Array.isArray(data.value)
      ? (data.value as Record<string, unknown>)
      : {};
  const existing = Array.isArray(current[feature])
    ? current[feature].filter((item): item is string => typeof item === "string")
    : [];
  const next = existing.includes(email) ? existing : [...existing, email];

  const { error } = await db.from("app_settings").upsert({
    key: "feature_waitlist",
    value: { ...current, [feature]: next },
  });

  return !error;
}
