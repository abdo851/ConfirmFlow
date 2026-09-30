"use client";

import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

const TABS = ["all", "meta", "tiktok", "google", "comingSoon"] as const;

export function EventsTabs({
  tab,
  status,
  range,
  labels,
  soon,
}: {
  tab: string;
  status: string;
  range: string;
  labels: {
    tabs: Record<(typeof TABS)[number], string>;
    status: string;
    dateRange: string;
    statuses: { sent: string; failed: string; skipped: string; all: string };
    ranges: { last24h: string; last7d: string; last30d: string; all: string };
    soonBadge: string;
    soonNames: { snapchat: string; pinterest: string; x: string };
  };
  soon: boolean;
}) {
  const router = useRouter();

  function open(next: { tab?: string; status?: string; range?: string }) {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    const nextStatus = next.status ?? status;
    const nextRange = next.range ?? range;
    if (nextTab !== "all") params.set("tab", nextTab);
    if (nextStatus) params.set("status", nextStatus);
    if (nextRange && nextRange !== "all") params.set("range", nextRange);
    const query = params.toString();
    router.push(query ? `/dashboard/ads-events?${query}` : "/dashboard/ads-events");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => open({ tab: key, status: key === "comingSoon" ? "" : status })}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              tab === key ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {labels.tabs[key]}
          </button>
        ))}
      </div>
      {soon ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {(["snapchat", "pinterest", "x"] as const).map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{labels.soonNames[key]}</h2>
                <Badge variant="muted">{labels.soonBadge}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <label className="text-sm text-muted">
            {labels.status}
            <select
              value={status}
              onChange={(event) => open({ status: event.target.value })}
              className="ms-2 min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">{labels.statuses.all}</option>
              <option value="sent">{labels.statuses.sent}</option>
              <option value="failed">{labels.statuses.failed}</option>
              <option value="skipped">{labels.statuses.skipped}</option>
            </select>
          </label>
          <label className="text-sm text-muted">
            {labels.dateRange}
            <select
              value={range}
              onChange={(event) => open({ range: event.target.value })}
              className="ms-2 min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">{labels.ranges.all}</option>
              <option value="24h">{labels.ranges.last24h}</option>
              <option value="7d">{labels.ranges.last7d}</option>
              <option value="30d">{labels.ranges.last30d}</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
