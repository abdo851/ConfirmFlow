"use client";

import { useState } from "react";
import { VideoEmbed } from "@/components/marketing/video-embed";
import type { VideoBlock } from "@/lib/videos/types";

export function PlacementVideo({
  video,
  dismissLabel,
}: {
  video: VideoBlock;
  dismissLabel?: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return null;
  }

  return (
    <section className="relative mb-6">
      {dismissLabel ? (
        <button
          type="button"
          className="absolute end-3 top-3 z-10 inline-flex min-h-11 items-center rounded-xl bg-white/90 px-3 text-sm font-medium text-foreground shadow-soft"
          onClick={() => setHidden(true)}
        >
          {dismissLabel}
        </button>
      ) : null}
      <VideoEmbed video={video} variant={dismissLabel ? "card" : "inline"} />
    </section>
  );
}
