"use server";

import { revalidatePath } from "next/cache";
import { safeHttpUrl } from "@/lib/ads/select";
import { createBlock, deleteBlock, updateBlock } from "@/lib/content/blocks";
import { readBlockPlacement } from "@/lib/content/placement";
import type { ContentBlock } from "@/lib/content/schema";
import { videoPlacements, type VideoPlacement } from "@/lib/videos/types";

export interface PlacedContentActionState {
  ok: boolean;
  error?: string;
}

function readPlacement(value: FormDataEntryValue | null): VideoPlacement {
  const placement = String(value ?? "");
  if (videoPlacements.includes(placement as VideoPlacement)) {
    return placement as VideoPlacement;
  }
  throw new Error("invalid_placement");
}

function readKind(value: FormDataEntryValue | null): "banner" | "link" {
  const kind = String(value ?? "");
  if (kind === "banner" || kind === "link") {
    return kind;
  }
  throw new Error("invalid_type");
}

function readInput(formData: FormData, existing?: ContentBlock | null) {
  const kind = readKind(formData.get("kind"));
  const placement = readPlacement(formData.get("placement"));
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const ctaLabel = String(formData.get("cta_label") ?? "").trim();
  const ctaUrl = String(formData.get("cta_url") ?? "").trim();
  const safeImage = imageUrl ? safeHttpUrl(imageUrl) : null;
  const safeCta = ctaUrl ? safeHttpUrl(ctaUrl) : null;

  if (imageUrl && !safeImage) {
    throw new Error("invalid_url");
  }
  if (ctaUrl && !safeCta) {
    throw new Error("invalid_url");
  }
  if (kind === "banner" && !safeImage) {
    throw new Error("image_required");
  }
  if (kind === "link" && (!ctaLabel || !safeCta)) {
    throw new Error("link_required");
  }

  const positionValue = Number(formData.get("position") ?? 0);
  const position = placement === "landing_hero" ? 1 : Number.isFinite(positionValue) ? Math.trunc(positionValue) : 0;

  return {
    type: kind === "banner" ? ("banner" as const) : ("ad" as const),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: safeImage,
    video_url: null,
    cta_label: ctaLabel || null,
    cta_url: safeCta,
    locale: existing?.locale ?? ("both" as const),
    is_active: formData.get("is_active") === "on",
    position,
    extra: {
      ...(existing?.extra ?? {}),
      placement,
    },
  };
}

function refresh() {
  const pages = [
    "",
    "/dashboard",
    "/onboarding",
    "/dashboard/admin/videos",
    "/dashboard/orders",
    "/dashboard/analytics",
    "/dashboard/connections",
    "/dashboard/shipping",
    "/dashboard/tracking",
    "/dashboard/marketing",
    "/dashboard/wallet",
    "/dashboard/workflow",
  ];
  for (const locale of ["/ar", "/en"]) {
    for (const page of pages) {
      revalidatePath(`${locale}${page}`);
    }
  }
}

export async function savePlacedContentAction(
  _state: PlacedContentActionState,
  formData: FormData,
): Promise<PlacedContentActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    if (id) {
      const { getBlock } = await import("@/lib/content/blocks");
      const existing = await getBlock(id);
      if (!existing || !readBlockPlacement(existing.extra)) {
        return { ok: false, error: "missing_id" };
      }
      await updateBlock(id, readInput(formData, existing));
    } else {
      await createBlock(readInput(formData));
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "failed" };
  }
}

export async function deletePlacedContentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await deleteBlock(id);
  refresh();
}
