import { describe, expect, it } from "vitest";
import { parseYouTubeId, youtubeEmbedUrl, youtubeThumbnail } from "@/lib/videos/youtube";

describe("youtube video urls", () => {
  it("reads an id from watch, share, and embed links", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects a non-youtube url", () => {
    expect(parseYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeEmbedUrl("https://example.com/video")).toBeNull();
    expect(youtubeThumbnail("not a url")).toBeNull();
  });
});
