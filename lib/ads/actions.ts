"use server";

import { revalidatePath } from "next/cache";
import { createAdvertisement, deleteAdvertisement, updateAdvertisement } from "@/lib/ads/queries";
import type { AdLocale, AdPlacement } from "@/lib/ads/types";
import { adLocales, adPlacements } from "@/lib/ads/types";

export interface AdvertisementActionState {
  ok: boolean;
  error?: string;
}

function readPlacement(value: FormDataEntryValue | null): AdPlacement {
  const placement = String(value ?? "");
  if (adPlacements.includes(placement as AdPlacement)) {
    return placement as AdPlacement;
  }
  throw new Error("invalid_placement");
}

function readLocale(value: FormDataEntryValue | null): AdLocale {
  const locale = String(value ?? "");
  if (adLocales.includes(locale as AdLocale)) {
    return locale as AdLocale;
  }
  throw new Error("invalid_locale");
}

function readInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: String(formData.get("image_url") ?? ""),
    cta_label: String(formData.get("cta_label") ?? ""),
    cta_url: String(formData.get("cta_url") ?? ""),
    locale: readLocale(formData.get("locale")),
    placement: readPlacement(formData.get("placement")),
    position: Number(formData.get("position") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

function refresh() {
  const pages = [
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/connections",
    "/dashboard/shipping",
    "/dashboard/analytics",
    "/dashboard/tracking",
    "/dashboard/workflow",
    "/dashboard/wallet",
    "/dashboard/marketing",
    "/dashboard/admin/advertisements",
  ];
  for (const locale of ["/ar", "/en"]) {
    for (const page of pages) {
      revalidatePath(`${locale}${page}`);
    }
  }
}

export async function createAdvertisementAction(
  _state: AdvertisementActionState,
  formData: FormData,
): Promise<AdvertisementActionState> {
  try {
    await createAdvertisement(readInput(formData));
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "create_failed" };
  }
}

export async function updateAdvertisementAction(
  _state: AdvertisementActionState,
  formData: FormData,
): Promise<AdvertisementActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { ok: false, error: "missing_id" };
    }
    await updateAdvertisement(id, readInput(formData));
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "update_failed" };
  }
}

export async function deleteAdvertisementAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await deleteAdvertisement(id);
  refresh();
}
