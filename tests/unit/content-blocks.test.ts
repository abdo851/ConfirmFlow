import { describe, expect, it } from "vitest";
import {
  parseContentBlockInput,
  reorderBlockIds,
  youtubeEmbedUrl,
} from "@/lib/content/schema";

describe("content blocks", () => {
  it("parses a banner payload", () => {
    const parsed = parseContentBlockInput({
      type: "banner",
      title: "Welcome",
      locale: "ar",
      is_active: true,
    });

    expect(parsed.type).toBe("banner");
    expect(parsed.title).toBe("Welcome");
    expect(parsed.locale).toBe("ar");
  });

  it("assigns positions from a drag order and skips duplicates", () => {
    expect(reorderBlockIds(["b", "a", "b", ""])).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ]);
  });

  it("builds a YouTube embed URL", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
    expect(youtubeEmbedUrl("https://youtu.be/xyz")).toBe(
      "https://www.youtube.com/embed/xyz",
    );
    expect(youtubeEmbedUrl("https://example.com/video")).toBeNull();
  });
});
