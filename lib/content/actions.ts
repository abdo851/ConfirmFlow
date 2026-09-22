"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isAppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/paths";
import {
  createBlock,
  deleteBlock,
  reorderBlocks,
  updateBlock,
} from "./blocks";
import type { ContentBlockType, ContentLocale } from "./schema";

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function blockInputFromForm(formData: FormData) {
  const type = read(formData, "type") as ContentBlockType;
  return {
    type,
    title: read(formData, "title"),
    description: read(formData, "description"),
    image_url: read(formData, "image_url"),
    video_url: read(formData, "video_url"),
    cta_label: read(formData, "cta_label"),
    cta_url: read(formData, "cta_url"),
    locale: (read(formData, "locale") || "both") as ContentLocale,
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
    extra: {},
  };
}

async function refreshContent() {
  const locale = await getLocale();
  const safeLocale = isAppLocale(locale) ? locale : "en";
  revalidatePath(withLocalePath(safeLocale, "/admin"));
  revalidatePath(withLocalePath("en", "/dashboard"));
  revalidatePath(withLocalePath("ar", "/dashboard"));
  revalidatePath(withLocalePath("en", "/onboarding"));
  revalidatePath(withLocalePath("ar", "/onboarding"));
}

export async function createBlockAction(formData: FormData): Promise<void> {
  await createBlock(blockInputFromForm(formData));
  await refreshContent();
  const locale = await getLocale();
  redirect({ href: "/admin", locale: isAppLocale(locale) ? locale : "en" });
}

export async function updateBlockAction(id: string, formData: FormData): Promise<void> {
  await updateBlock(id, blockInputFromForm(formData));
  await refreshContent();
  const locale = await getLocale();
  redirect({ href: "/admin", locale: isAppLocale(locale) ? locale : "en" });
}

export async function deleteBlockAction(id: string): Promise<void> {
  await deleteBlock(id);
  await refreshContent();
}

export async function reorderBlocksAction(ids: string[]): Promise<void> {
  await reorderBlocks(ids);
  await refreshContent();
}

export async function toggleBlockAction(id: string, isActive: boolean): Promise<void> {
  const { getBlock } = await import("./blocks");
  const existing = await getBlock(id);
  if (!existing) {
    return;
  }
  await updateBlock(id, { ...existing, is_active: isActive, extra: existing.extra });
  await refreshContent();
}
