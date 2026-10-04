import { getLocale } from "next-intl/server";
import { safeHttpUrl } from "@/lib/ads/select";
import { listBlocks } from "@/lib/content/blocks";
import { visiblePlacedBlocks } from "@/lib/content/placement";
import type { ContentBlock } from "@/lib/content/schema";
import type { VideoPlacement } from "@/lib/videos/types";

export async function AdPlacement({
  placement,
  className,
}: {
  placement: VideoPlacement;
  className?: string;
}) {
  const locale = await getLocale();
  const language = locale === "ar" ? "ar" : "en";
  let items: ContentBlock[] = [];
  try {
    items = visiblePlacedBlocks(await listBlocks(), placement, language);
  } catch {
    items = [];
  }
  const visible = items.filter((item) => item.is_active);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={className ? `${className} grid gap-4` : "grid gap-4"}>
      {visible.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentCard({ item }: { item: ContentBlock }) {
  const image = safeHttpUrl(item.image_url);
  const cta = safeHttpUrl(item.cta_url);
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5">
      {image ? (
        <div
          role="img"
          aria-label={item.title ?? ""}
          className="mb-3 h-40 w-full rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
        />
      ) : null}
      {item.title ? <p className="text-base font-semibold">{item.title}</p> : null}
      {item.description ? <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p> : null}
      {item.cta_label && cta ? (
        <a
          href={cta}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {item.cta_label}
        </a>
      ) : null}
    </article>
  );
}
