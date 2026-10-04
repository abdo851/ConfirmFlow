import { describe, expect, it } from "vitest";
import { isPlacedContent, readBlockPlacement, visiblePlacedBlocks } from "@/lib/content/placement";
import type { ContentBlock } from "@/lib/content/schema";
import { placementChoices, videoPlacements } from "@/lib/videos/types";

function block(overrides: Partial<ContentBlock>): ContentBlock {
  return {
    id: "1",
    type: "banner",
    title: "Banner",
    description: null,
    image_url: "https://example.com/a.png",
    video_url: null,
    cta_label: null,
    cta_url: null,
    extra: { placement: "orders" },
    position: 1,
    is_active: true,
    locale: "both",
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("platform content placement", () => {
  it("uses the existing video placement names", () => {
    expect(readBlockPlacement({ placement: "landing_hero" })).toBe("landing_hero");
    expect(readBlockPlacement({ placement: "unknown" })).toBeNull();
    expect(videoPlacements).toContain("dashboard_top");
    expect(placementChoices()).not.toContain("global");
    expect(placementChoices("global")).toContain("global");
  });

  it("treats only placed banners and promotional links as platform content", () => {
    expect(isPlacedContent(block({}))).toBe(true);
    expect(isPlacedContent(block({ type: "ad" }))).toBe(true);
    expect(isPlacedContent(block({ type: "text" }))).toBe(false);
    expect(isPlacedContent(block({ extra: {} }))).toBe(false);
  });

  it("shows active content for the placement and locale, ordered by position", () => {
    const rows = visiblePlacedBlocks(
      [
        block({ id: "later", position: 2 }),
        block({ id: "first", position: 0, type: "ad" }),
        block({ id: "other", extra: { placement: "wallet" } }),
        block({ id: "hidden", is_active: false }),
        block({ id: "arabic", locale: "ar" }),
      ],
      "orders",
      "en",
    );

    expect(rows.map((row) => row.id)).toEqual(["first", "later"]);
  });
});