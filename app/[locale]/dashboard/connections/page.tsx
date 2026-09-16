import { getTranslations } from "next-intl/server";
import { ConnectionStatus } from "@/components/dashboard";

export default async function DashboardConnectionsPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("connectionsTitle")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("connectionsManageDescription")}
        </p>
      </div>
      <ConnectionStatus />
    </div>
  );
}
