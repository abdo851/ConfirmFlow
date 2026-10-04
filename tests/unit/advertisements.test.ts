import { describe, expect, it } from "vitest";
import { safeHttpUrl, visibleAdvertisements } from "@/lib/ads/select";
import { adPlacements, type Advertisement } from "@/lib/ads/types";

function row(overrides: Partial<Advertisement>): Advertisement {
  return {
    id: "1",
    title: "Offer",
    description: null,
    image_url: null,
    cta_label: null,
    cta_url: null,
    locale: "both",
    placement: "orders",
    position: 0,
    is_active: true,
    created_by: null,
    created_at: "2026-10-02T00:00:00.000Z",
    updated_at: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("advertisement placement", () => {
  it("uses the approved placement names", () => {
    expect(adPlacements).toEqual([
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
    ]);
  });

  it("keeps active rows for the placement and locale, ordered by position", () => {
    const visible = visibleAdvertisements(
      [
        row({ id: "later", position: 2, created_at: "2026-10-02T00:00:02.000Z" }),
        row({ id: "inactive", is_active: false, position: 0 }),
        row({ id: "other", placement: "wallet", position: 0 }),
        row({ id: "arabic", locale: "ar", position: 1 }),
        row({ id: "first", position: 1, created_at: "2026-10-02T00:00:01.000Z" }),
      ],
      "orders",
      "en",
    );

    expect(visible.map((item) => item.id)).toEqual(["first", "later"]);
  });

  it("accepts only http and https links", () => {
    expect(safeHttpUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });
});
