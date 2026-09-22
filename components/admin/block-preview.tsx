"use client";

import { useTranslations } from "next-intl";
import { youtubeEmbedUrl, type ContentBlock } from "@/lib/content/schema";

function CtaLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
    >
      {label}
    </a>
  );
}

export function BlockPreview({ block }: { block: ContentBlock }) {
  const t = useTranslations("admin");
  const embed = youtubeEmbedUrl(block.video_url);

  if (block.type === "banner") {
    return (
      <aside className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50">
        {block.image_url ? (
          <div
            role="img"
            aria-label={block.title ?? ""}
            className="mb-3 h-40 w-full rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(block.image_url)})` }}
          />
        ) : null}
        <p className="text-base font-semibold">{block.title}</p>
        {block.description ? <p className="mt-1 text-sm">{block.description}</p> : null}
        {block.cta_label && block.cta_url ? (
          <a href={block.cta_url} className="mt-3 inline-flex text-sm font-medium underline">
            {block.cta_label}
          </a>
        ) : null}
      </aside>
    );
  }

  if (block.type === "video") {
    return (
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        {embed ? (
          <iframe
            className="aspect-video w-full rounded-xl"
            src={embed}
            title={block.title ?? t("types.video")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}
        <h3 className="mt-3 text-base font-semibold">{block.title}</h3>
        {block.description ? <p className="mt-1 text-sm text-muted">{block.description}</p> : null}
        {block.cta_url ? (
          <div className="mt-3">
            <CtaLink href={block.cta_url} label={block.cta_label || t("watchNow")} />
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium">{t("watchNow")}</p>
        )}
      </article>
    );
  }

  if (block.type === "ad") {
    return (
      <article className="rounded-2xl border border-line bg-gradient-to-br from-indigo-50 to-teal-50 p-4 dark:from-indigo-950/40 dark:to-teal-950/30">
        <p className="text-base font-semibold">{block.title}</p>
        {block.description ? <p className="mt-1 text-sm text-muted">{block.description}</p> : null}
        {block.cta_label && block.cta_url ? (
          <div className="mt-3">
            <CtaLink href={block.cta_url} label={block.cta_label} />
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      {block.title ? <h3 className="text-base font-semibold">{block.title}</h3> : null}
      {block.description ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{block.description}</p>
      ) : null}
    </article>
  );
}
