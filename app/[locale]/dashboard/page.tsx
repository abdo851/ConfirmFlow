import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { ConnectionStatus, SetupProgress } from "@/components/dashboard";
import { OrderStatusBadge } from "@/components/orders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkline } from "@/components/ui/sparkline";
import { StatCard } from "@/components/ui/stat-card";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { DashboardVideoBar } from "@/components/marketing/dashboard-video-bar";
import { SectionHelp } from "@/components/dashboard/section-help";
import { ContentBlockFeed } from "@/components/content/content-block-feed";
import { getVideoForPlacement } from "@/lib/videos/queries";
import { listActiveBlocks } from "@/lib/content/blocks";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";
import { getDashboardTimeseries } from "@/lib/dashboard/get-dashboard-timeseries";
import {
  formatMoneyMinor,
  formatOrderCustomerContact,
  formatOrderDisplayIdentifier,
} from "@/lib/orders/format";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";

function StatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 16V8M10 16V5M15 16v-4M20 16V9" strokeLinecap="round" />
    </svg>
  );
}

async function readDisplayName(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: unknown } | null;
}) {
  let profileName = "";
  try {
    const db = await createUserDatabaseClient();
    const { data } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const row = data as { full_name?: string | null } | null;
    profileName = row?.full_name?.trim() ?? "";
  } catch {
    profileName = "";
  }
  if (profileName) {
    return profileName;
  }
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }
  return user.email?.split("@")[0]?.trim() ?? "";
}

function last30Days() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const displayName = await readDisplayName(user);
  const t = await getTranslations("dashboard");
  const ordersT = await getTranslations("orders");
  const nav = await getTranslations("navigation");
  const today = new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date());
  const [stats, series, recentResult, blocks] = await Promise.all([
    getDashboardStats({ owner_id: user.id, date_range: last30Days() }),
    getDashboardTimeseries({ owner_id: user.id, days: 7 }),
    getOrdersForAuthenticatedUser(),
    listActiveBlocks(locale === "ar" ? "ar" : "en"),
  ]);
  const recent = (recentResult?.orders ?? []).slice(0, 5);
  const [topVideo, overviewVideo] = await Promise.all([
    getVideoForPlacement("dashboard_top"),
    getVideoForPlacement("overview"),
  ]);
  const currency = recent[0]?.currency ?? "USD";
  const seriesStart = series[0] ? series[0].new + series[0].confirmed : 0;
  const seriesEnd = series.length
    ? series[series.length - 1].new + series[series.length - 1].confirmed
    : 0;
  const rising = seriesEnd >= seriesStart;
  const cards: Array<{
    label: string;
    value: string;
    tone: "indigo" | "teal" | "amber" | "emerald";
    series?: number[];
  }> = [
    { label: t("stats.new"), value: String(stats.new_orders), tone: "indigo", series: series.map((point) => point.new) },
    { label: t("stats.confirmed"), value: String(stats.confirmed_orders), tone: "teal", series: series.map((point) => point.confirmed) },
    { label: t("stats.rejected"), value: String(stats.rejected_orders), tone: "amber" },
    { label: t("stats.archived"), value: String(stats.archived_orders), tone: "emerald" },
  ];

  return (
    <div className="dash-stagger animate-fade-in space-y-8">
      {topVideo ? (
        <DashboardVideoBar video={topVideo} watchLabel={t("watchNow")} dismissLabel={t("videoDismiss")} />
      ) : null}
      <section className="dash-hero relative overflow-hidden rounded-2xl border border-line p-6 shadow-soft sm:p-8">
        <div className="absolute end-4 top-4">
          <SectionHelp video={overviewVideo} />
        </div>
        <p className="text-sm font-medium text-muted">{t("welcomeTitle")}</p>
        <p className="mt-1 text-xs text-muted">{today}</p>
        <h1 className="mt-2 text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
          {displayName || t("greetingFallback")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {t("overviewDescription")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard/orders">
            {nav("orders")}
          </Button>
          <Link
            href="/dashboard/connections"
            className="pressable inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {nav("connections")}
          </Link>
          <Link
            href="/onboarding"
            className="pressable inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {nav("onboarding")}
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
            trend={rising ? t("trendUp") : t("trendDown")}
            icon={<StatIcon />}
            series={card.series}
            enterIndex={index}
          />
        ))}
      </div>
      <Sparkline
        label={t("chartLabel")}
        caption={t("chartSummary", {
          rate: stats.confirmation_rate.toFixed(1),
          revenue: formatMoneyMinor(Number(stats.confirmed_revenue_minor), currency),
        })}
        values={series.map((point) => point.new + point.confirmed)}
      />
      <SetupProgress />
      <ContentBlockFeed blocks={blocks} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectionStatus />
        <Card title={t("recentEventsTitle")} description={t("recentEventsDescription")}>
          {recent.length === 0 ? (
            <EmptyState title={t("recentEventsEmpty")} description={t("recentEventsDescription")} />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.id} className="data-row flex items-start justify-between gap-3 rounded-xl px-2 py-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium">
                      {formatOrderDisplayIdentifier(order)}
                    </Link>
                    <span className="mt-1 block truncate text-sm text-muted">
                      {formatOrderCustomerContact(order) ?? ordersT("customerUnavailable")}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="block text-sm">{formatMoneyMinor(order.totalAmountMinor, order.currency)}</span>
                    <span className="mt-1 inline-flex">
                      <OrderStatusBadge status={order.confirmationStatus} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
