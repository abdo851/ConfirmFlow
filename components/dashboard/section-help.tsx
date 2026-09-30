"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { VideoBlock, VideoPlacement } from "@/lib/videos/types";
import { youtubeEmbedUrl } from "@/lib/videos/youtube";

const SETUP_PLACEMENTS = new Set<VideoPlacement>(["shipping", "connections", "marketing", "tracking"]);
const PULSE_KEY = "confirma-help-icon-pulsed";

function isSetupPlacement(placement: VideoPlacement) {
  return SETUP_PLACEMENTS.has(placement);
}

export function SectionHelp({ video }: { video: VideoBlock | null }) {
  const t = useTranslations("dashboard");
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!video) {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      if (sessionStorage.getItem(PULSE_KEY) === "1") {
        return;
      }
      if (reduce) {
        sessionStorage.setItem(PULSE_KEY, "1");
        return;
      }
    } catch {
      if (reduce) {
        return;
      }
    }
    setPulse(true);
  }, [video]);

  if (!video) {
    return null;
  }

  const label = isSetupPlacement(video.placement) ? t("helpVideoSetup") : t("helpVideoWatch");

  return (
    <>
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={`help-icon group/help relative inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-slate-500 shadow-soft transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-950 ${pulse ? "help-icon-pulse" : ""}`}
          aria-label={label}
          aria-describedby={tipId}
          onClick={() => setOpen(true)}
          onAnimationEnd={() => {
            setPulse(false);
            try {
              sessionStorage.setItem(PULSE_KEY, "1");
            } catch {
              // The pulse already finished for this visit.
            }
          }}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="currentColor">
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
          <span
            id={tipId}
            role="tooltip"
            className="pointer-events-none absolute top-[calc(100%+0.5rem)] end-0 z-20 hidden w-max max-w-48 rounded-xl border border-line bg-white px-3 py-1.5 text-start text-xs font-medium text-slate-700 opacity-0 shadow-soft transition duration-200 group-hover/help:opacity-100 group-focus-visible/help:opacity-100 sm:block dark:bg-slate-950 dark:text-slate-200"
          >
            {label}
          </span>
        </button>
        <span className="hidden text-sm text-muted sm:inline">{label}</span>
      </div>
      {open ? <HelpVideoModal video={video} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HelpVideoModal({ video, onClose }: { video: VideoBlock; onClose: () => void }) {
  const t = useTranslations("dashboard");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const embed = youtubeEmbedUrl(video.youtube_url);
  const setup = isSetupPlacement(video.placement);

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onClose();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const items = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [mounted, requestClose]);

  if (!mounted) {
    return null;
  }

  const state = closing ? "closing" : "open";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        data-state={state}
        className="help-modal-backdrop absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label={t("helpVideoCloseVideo")}
        onClick={requestClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-state={state}
        className="help-modal relative z-10 w-full max-w-3xl rounded-2xl border border-line bg-white p-5 shadow-medium dark:bg-slate-950"
      >
        <div className="relative">
          <div className="min-w-0 pr-14">
            {setup ? (
              <p className="text-xs font-semibold tracking-wide text-primary">{t("helpVideoSetupLabel")}</p>
            ) : null}
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {video.title || t("helpVideoDialog")}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-xl border border-line bg-white text-slate-700 shadow-soft hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-900"
            aria-label={t("helpVideoCloseVideo")}
            onClick={requestClose}
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {video.description ? <p className="mt-2 text-sm leading-6 text-muted">{video.description}</p> : null}
        {embed ? (
          <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-slate-950">
            <iframe
              className="size-full"
              src={embed}
              title={video.title || t("helpVideoDialog")}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-soft transition duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={requestClose}
          >
            {t("helpVideoCloseVideo")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
