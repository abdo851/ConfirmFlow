"use client";

import type { AdEventStats } from "@/lib/ads/events/queries";

export function EventsStats({
  stats,
  locale,
  labels,
}: {
  stats: AdEventStats[];
  locale: string;
  labels: {
    sent: string;
    failed: string;
    lastSent: string;
    noFailures: string;
    platforms: Record<AdEventStats["platform"], string>;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((item) => {
        const healthy = item.failed === 0;
        return (
          <article
            key={item.platform}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{labels.platforms[item.platform]}</h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs ${healthy ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
              >
                <span aria-hidden className={`size-2 rounded-full ${healthy ? "bg-emerald-500" : "bg-rose-500"}`} />
                {healthy ? labels.noFailures : labels.failed}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{item.sent}</p>
            <p className="text-xs text-muted">{labels.sent}</p>
            <p className="mt-2 text-sm text-muted">
              {labels.failed}: {item.failed}
            </p>
            <p className="mt-1 text-xs text-muted">
              {labels.lastSent}: {item.lastSentAt ? new Date(item.lastSentAt).toLocaleString(locale) : "—"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
