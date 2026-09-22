import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ConnectionStatus,
  RecentEventsPlaceholder,
  SetupProgress,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const nav = await getTranslations("navigation");

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-500 p-6 text-white shadow-medium sm:p-8">
        <p className="text-sm font-medium text-white/80">{t("welcomeTitle")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("overviewTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
          {t("overviewDescription")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard/orders" variant="secondary">
            {nav("orders")}
          </Button>
          <Link
            href="/dashboard/connections"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/15 px-4 text-sm font-medium text-white hover:bg-white/25"
          >
            {nav("connections")}
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/15 px-4 text-sm font-medium text-white hover:bg-white/25"
          >
            {nav("onboarding")}
          </Link>
        </div>
      </section>

      <div>
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          {t("quickActions")}
        </h2>
      </div>

      <SetupProgress />
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectionStatus />
        <RecentEventsPlaceholder />
      </div>
    </div>
  );
}
