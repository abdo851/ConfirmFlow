import "server-only";

import { isAdLocale, visibleAdvertisements } from "@/lib/ads/select";
import type { AdPlacement, Advertisement, AdvertisementInput } from "@/lib/ads/types";
import { adPlacements } from "@/lib/ads/types";
import { isAdminRole } from "@/lib/admin/roles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import { createUserDatabaseClient } from "@/lib/database/user-client";

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("advertisements");
}

export async function getAdsForPlacement(
  placement: AdPlacement,
  locale: "ar" | "en",
): Promise<Advertisement[]> {
  try {
    const db = await createUserDatabaseClient();
    const { data, error } = await db
      .from("advertisements")
      .select("*")
      .eq("placement", placement)
      .eq("is_active", true)
      .in("locale", ["both", locale])
      .order("position", { ascending: true });

    if (error || !data) {
      return [];
    }

    return visibleAdvertisements(data as Advertisement[], placement, locale);
  } catch {
    return [];
  }
}

export async function listAdvertisements(): Promise<Advertisement[]> {
  await assertAdmin();
  const db = createDatabaseClient();
  const { data, error } = await db
    .from("advertisements")
    .select("*")
    .order("placement", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data as Advertisement[] | null) ?? [];
}

export async function createAdvertisement(input: AdvertisementInput): Promise<Advertisement> {
  const user = await assertAdmin();
  const row = normalizeInput(input);
  const db = createDatabaseClient();
  const { data, error } = await db
    .from("advertisements")
    .insert({ ...row, created_by: user.id })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "create_failed");
  }

  return data as Advertisement;
}

export async function updateAdvertisement(id: string, input: AdvertisementInput): Promise<Advertisement> {
  await assertAdmin();
  const row = normalizeInput(input);
  const db = createDatabaseClient();
  const { data, error } = await db.from("advertisements").update(row).eq("id", id).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "update_failed");
  }

  return data as Advertisement;
}

export async function deleteAdvertisement(id: string): Promise<void> {
  await assertAdmin();
  const db = createDatabaseClient();
  const { error } = await db.from("advertisements").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

async function assertAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("unauthenticated");
  }

  const db = await createUserDatabaseClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(data?.role)) {
    throw new Error("forbidden");
  }

  return user;
}

function normalizeInput(input: AdvertisementInput) {
  if (!adPlacements.includes(input.placement)) {
    throw new Error("invalid_placement");
  }
  if (!isAdLocale(input.locale)) {
    throw new Error("invalid_locale");
  }

  return {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    image_url: input.image_url?.trim() || null,
    cta_label: input.cta_label?.trim() || null,
    cta_url: input.cta_url?.trim() || null,
    locale: input.locale,
    placement: input.placement,
    position: Number.isFinite(input.position) ? Math.trunc(input.position ?? 0) : 0,
    is_active: input.is_active !== false,
  };
}
