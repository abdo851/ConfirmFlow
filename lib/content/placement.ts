import type { ContentBlock } from "@/lib/content/schema";
import { videoPlacements, type VideoPlacement } from "@/lib/videos/types";

export const placedContentTypes = ["banner", "ad"] as const;

export type PlacedContentKind = "banner" | "link";

export function readBlockPlacement(extra: Record<string, unknown> | null | undefined): VideoPlacement | null {
  const value = extra?.placement;
  if (typeof value !== "string") {
    return null;
  }
  return videoPlacements.includes(value as VideoPlacement) ? (value as VideoPlacement) : null;
}

export function isPlacedContent(block: Pick<ContentBlock, "type" | "extra">): boolean {
  return (block.type === "banner" || block.type === "ad") && readBlockPlacement(block.extra) != null;
}

export function visiblePlacedBlocks(
  blocks: ContentBlock[],
  placement: VideoPlacement,
  locale: "ar" | "en",
): ContentBlock[] {
  return blocks
    .filter(
      (block) =>
        block.is_active &&
        isPlacedContent(block) &&
        readBlockPlacement(block.extra) === placement &&
        (block.locale === "both" || block.locale === locale),
    )
    .sort((left, right) => left.position - right.position || left.created_at.localeCompare(right.created_at));
}

export function placedContentKind(block: Pick<ContentBlock, "type">): PlacedContentKind | null {
  if (block.type === "banner") {
    return "banner";
  }
  if (block.type === "ad") {
    return "link";
  }
  return null;
}
