"use client";

import { useState } from "react";
import type { VideoBlock } from "@/lib/videos/types";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/videos/youtube";

interface VideoEmbedProps {
  video: Pick<VideoBlock, "title" | "description" | "youtube_url" | "thumbnail_url">;
  variant?: "hero" | "inline" | "card";
}

export function VideoEmbed({ video, variant = "card" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(video.youtube_url);
  const thumb = video.thumbnail_url || youtubeThumbnail(video.youtube_url);
  const frameClass =
    variant === "hero"
      ? "video-glow aspect-video w-full overflow-hidden rounded-3xl border border-white/40 bg-slate-950 shadow-large"
      : "aspect-video w-full overflow-hidden rounded-2xl border border-line bg-slate-950 shadow-medium";

  return (
    <figure className={variant === "inline" ? "max-w-3xl" : "w-full"}>
      <div className={frameClass}>
        {playing && embed ? (
          <iframe
            className="size-full"
            src={embed}
            title={video.title || "YouTube"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="group relative block size-full"
            aria-label={video.title || "Play"}
            onClick={() => embed && setPlaying(true)}
            disabled={!embed}
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="size-full object-cover" />
            ) : (
              <span className="block size-full bg-gradient-to-br from-indigo-700 to-teal-600" />
            )}
            <span className="absolute inset-0 bg-slate-950/25 transition-colors group-hover:bg-slate-950/35" />
            <span className="play-pulse absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-large sm:size-20">
              <svg viewBox="0 0 24 24" className="ms-1 size-7" aria-hidden fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {video.title || video.description ? (
        <figcaption className="mt-3 text-start">
          {video.title ? <p className="text-base font-semibold">{video.title}</p> : null}
          {video.description ? <p className="mt-1 text-sm leading-6 text-muted">{video.description}</p> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
