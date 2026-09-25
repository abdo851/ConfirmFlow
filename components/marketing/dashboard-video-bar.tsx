"use client";

import { useEffect, useState } from "react";
import { VideoEmbed } from "@/components/marketing/video-embed";
import type { VideoBlock } from "@/lib/videos/types";
import { youtubeThumbnail } from "@/lib/videos/youtube";

const storageKey = (id: string) => `confirma-video-dismiss:${id}`;

export function DashboardVideoBar({
  video,
  watchLabel,
  dismissLabel,
}: {
  video: VideoBlock;
  watchLabel: string;
  dismissLabel: string;
}) {
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const thumb = video.thumbnail_url || youtubeThumbnail(video.youtube_url);

  useEffect(() => {
    setHidden(window.localStorage.getItem(storageKey(video.id)) === "1");
  }, [video.id]);

  if (hidden) {
    return null;
  }

  function dismiss() {
    window.localStorage.setItem(storageKey(video.id), "1");
    setHidden(true);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-soft">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
        {thumb ? (
          <span
            aria-hidden
            className="h-[60px] w-20 shrink-0 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${thumb})` }}
          />
        ) : (
          <span className="inline-flex h-[60px] w-20 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-semibold text-indigo-700">
            ▶
          </span>
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{video.title || watchLabel}</p>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
          onClick={() => setOpen((value) => !value)}
        >
          {watchLabel}
        </button>
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted"
          aria-label={dismissLabel}
          onClick={dismiss}
        >
          ×
        </button>
      </div>
      {open ? (
        <div className="border-t border-line p-3">
          <VideoEmbed video={video} variant="card" />
        </div>
      ) : null}
    </section>
  );
}
