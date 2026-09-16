import { getTranslations } from "next-intl/server";
import {
  ConnectionStatus,
  RecentEventsPlaceholder,
  SetupProgress,
} from "@/components/dashboard";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("overviewTitle")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("overviewDescription")}
        </p>
      </div>
      <SetupProgress />
      <div className="grid gap-8 lg:grid-cols-2">
        <ConnectionStatus />
        <RecentEventsPlaceholder />
      </div>
    </div>
  );
}
