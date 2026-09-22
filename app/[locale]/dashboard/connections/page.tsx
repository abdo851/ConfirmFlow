import { getTranslations } from "next-intl/server";
import { ConnectionStatus } from "@/components/dashboard";

export default async function DashboardConnectionsPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("connectionsTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {t("connectionsManageDescription")}
        </p>
      </div>
      <ConnectionStatus />
    </div>
  );
}
