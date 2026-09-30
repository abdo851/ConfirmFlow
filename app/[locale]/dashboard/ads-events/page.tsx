import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { EventsStats } from "@/components/ads-events/events-stats";
import { EventsTable } from "@/components/ads-events/events-table";
import { EventsTabs } from "@/components/ads-events/events-tabs";
import { DashboardSection } from "@/components/dashboard/section";
import { getAdEventStats, listAdEvents, type AdEventStats } from "@/lib/ads/events/queries";
import type { AdEventPlatform, AdEventStatus } from "@/lib/ads/events/log";
import { getAuthenticatedUser } from "@/lib/auth/session";

const PAGE_SIZE = 50;

function emptyStats(): AdEventStats[] {
  return (["meta", "tiktok", "google"] as const).map((platform) => ({
    platform,
    sent: 0,
    failed: 0,
    skipped: 0,
    lastSentAt: null,
  }));
}

function sinceFor(range: string): string | undefined {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return undefined;
}

export default async function AdEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; status?: string; range?: string; page?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("dashboard.adsEvents");
  const tab = query.tab === "meta" || query.tab === "tiktok" || query.tab === "google" || query.tab === "comingSoon" ? query.tab : "all";
  const status = query.status === "sent" || query.status === "failed" || query.status === "skipped" ? query.status : "";
  const range = query.range === "24h" || query.range === "7d" || query.range === "30d" ? query.range : "all";
  const page = Math.max(1, Number(query.page) || 1);
  const platform = tab === "all" || tab === "comingSoon" ? undefined : (tab as AdEventPlatform);

  let rows: Awaited<ReturnType<typeof listAdEvents>>["rows"] = [];
  let total = 0;
  let stats = emptyStats();
  if (tab !== "comingSoon") {
    try {
      const listed = await listAdEvents(user.id, {
        platform,
        status: (status || undefined) as AdEventStatus | undefined,
        since: sinceFor(range),
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      rows = listed.rows;
      total = listed.total;
      stats = await getAdEventStats(user.id);
    } catch {
      rows = [];
      total = 0;
      stats = emptyStats();
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = new URLSearchParams();
  if (tab !== "all") base.set("tab", tab);
  if (status) base.set("status", status);
  if (range !== "all") base.set("range", range);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(base);
    if (nextPage > 1) params.set("page", String(nextPage));
    const value = params.toString();
    return value ? `/dashboard/ads-events?${value}` : "/dashboard/ads-events";
  }

  return (
    <DashboardSection title={t("title")} description={t("subtitle")}>
      <EventsStats
        stats={stats}
        locale={locale}
        labels={{
          sent: t("stats.sent"),
          failed: t("stats.failed"),
          lastSent: t("stats.lastSent"),
          noFailures: t("stats.noFailures"),
          platforms: { meta: t("tabs.meta"), tiktok: t("tabs.tiktok"), google: t("tabs.google") },
        }}
      />
      <EventsTabs
        tab={tab}
        status={status}
        range={range}
        soon={tab === "comingSoon"}
        labels={{
          tabs: {
            all: t("tabs.all"),
            meta: t("tabs.meta"),
            tiktok: t("tabs.tiktok"),
            google: t("tabs.google"),
            comingSoon: t("tabs.comingSoon"),
          },
          status: t("filters.status"),
          dateRange: t("filters.dateRange"),
          statuses: { sent: t("status.sent"), failed: t("status.failed"), skipped: t("status.skipped"), all: t("filters.all") },
          ranges: { last24h: t("filters.last24h"), last7d: t("filters.last7d"), last30d: t("filters.last30d"), all: t("filters.all") },
          soonBadge: t("tabs.comingSoon"),
          soonNames: { snapchat: t("comingSoon.snapchat"), pinterest: t("comingSoon.pinterest"), x: t("comingSoon.x") },
        }}
      />
      {tab === "comingSoon" ? null : (
        <EventsTable
          rows={rows}
          locale={locale}
          labels={{
            time: t("table.time"),
            order: t("table.order"),
            event: t("table.event"),
            platform: t("table.platform"),
            status: t("table.status"),
            http: t("table.http"),
            error: t("table.error"),
            statuses: { sent: t("status.sent"), failed: t("status.failed"), skipped: t("status.skipped") },
            payload: t("modal.payload"),
            response: t("modal.response"),
            close: t("modal.close"),
            empty: t("empty"),
          }}
        />
      )}
      {tab !== "comingSoon" && total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="min-h-11 rounded-xl px-3 py-2 text-primary">
              {t("prev")}
            </Link>
          ) : (
            <span className="min-h-11 px-3 py-2 text-muted">{t("prev")}</span>
          )}
          <span className="text-muted">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="min-h-11 rounded-xl px-3 py-2 text-primary">
              {t("next")}
            </Link>
          ) : (
            <span className="min-h-11 px-3 py-2 text-muted">{t("next")}</span>
          )}
        </div>
      ) : null}
    </DashboardSection>
  );
}
