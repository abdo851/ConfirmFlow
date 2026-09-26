import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { DashboardSection } from "@/components/dashboard/section";
import { ExportOrdersButton } from "@/components/orders/export-orders-button";
import { Sparkline } from "@/components/ui/sparkline";
import { StatCard } from "@/components/ui/stat-card";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";
import { getDashboardTimeseries } from "@/lib/dashboard/get-dashboard-timeseries";
import { formatMoneyMinor } from "@/lib/orders/format";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";

function StatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 16V8M10 16V5M15 16v-4M20 16V9" strokeLinecap="round" />
    </svg>
  );
}

function resolveRange(range: string | undefined, from: string | undefined, to: string | undefined) {
  const end = new Date();
  const start = new Date(end);
  if (range === "today") {
    start.setUTCHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: end.toISOString(), days: 1, key: "today" as const };
  }
  if (range === "7d") {
    start.setUTCDate(start.getUTCDate() - 7);
    return { from: start.toISOString(), to: end.toISOString(), days: 7, key: "7d" as const };
  }
  if (range === "custom" && from && to) {
    const customStart = new Date(from);
    const customEnd = new Date(to);
    if (!Number.isNaN(customStart.getTime()) && !Number.isNaN(customEnd.getTime()) && customEnd > customStart) {
      const days = Math.min(
        90,
        Math.max(1, Math.ceil((customEnd.getTime() - customStart.getTime()) / 86_400_000)),
      );
      return { from: customStart.toISOString(), to: customEnd.toISOString(), days, key: "custom" as const };
    }
  }
  start.setUTCDate(start.getUTCDate() - 30);
  return { from: start.toISOString(), to: end.toISOString(), days: 30, key: "30d" as const };
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const range = resolveRange(query.range, query.from, query.to);
  const t = await getTranslations("dashboard");
  const pages = await getTranslations("dashboard.pages");
  const [stats, series, recentResult] = await Promise.all([
    getDashboardStats({ owner_id: user.id, date_range: { from: range.from, to: range.to } }),
    getDashboardTimeseries({ owner_id: user.id, days: range.days }),
    getOrdersForAuthenticatedUser(),
  ]);
  const currency = recentResult?.orders[0]?.currency ?? "USD";
  const filters = [
    { key: "today", href: "/dashboard/analytics?range=today", label: pages("rangeToday") },
    { key: "7d", href: "/dashboard/analytics?range=7d", label: pages("range7") },
    { key: "30d", href: "/dashboard/analytics?range=30d", label: pages("range30") },
  ] as const;

  return (
    <DashboardSection title={pages("analyticsTitle")} description={pages("analyticsDescription")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.href}
            prefetch
            className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm ${
              range.key === filter.key ? "bg-primary text-primary-foreground" : "border border-line bg-surface"
            }`}
          >
            {filter.label}
          </Link>
        ))}
        </div>
        <ExportOrdersButton />
      </div>
      <form action={`/${locale}/dashboard/analytics`} method="get" className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="range" value="custom" />
        <label className="w-full text-sm">
          <span className="mb-1 block text-muted">{pages("from")}</span>
          <input name="from" type="date" className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm sm:text-base" />
        </label>
        <label className="w-full text-sm">
          <span className="mb-1 block text-muted">{pages("to")}</span>
          <input name="to" type="date" className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm sm:text-base" />
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
          {pages("apply")}
        </button>
      </form>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stats.new")} value={String(stats.new_orders)} icon={<StatIcon />} />
        <StatCard label={t("stats.confirmed")} value={String(stats.confirmed_orders)} icon={<StatIcon />} />
        <StatCard label={t("stats.rejected")} value={String(stats.rejected_orders)} icon={<StatIcon />} />
        <StatCard label={t("stats.archived")} value={String(stats.archived_orders)} icon={<StatIcon />} />
      </div>
      <Sparkline
        label={t("chartLabel")}
        caption={t("chartSummary", {
          rate: stats.confirmation_rate.toFixed(1),
          revenue: formatMoneyMinor(Number(stats.confirmed_revenue_minor), currency),
        })}
        values={series.map((point) => point.new + point.confirmed)}
      />
    </DashboardSection>
  );
}
