import { getTranslations } from "next-intl/server";
import { AddStoreDialog } from "@/components/connections/add-store-dialog";
import { ProviderStatusList } from "@/components/connections/provider-status-list";
import { BackButton } from "@/components/ui/back-button";
import { SectionHelp } from "@/components/dashboard/section-help";
import { listAccountStores } from "@/lib/connections/account-stores";
import { getLatestMetaDeliverySummary } from "@/lib/connections/meta-delivery-summary";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";
import { getVideoForPlacement } from "@/lib/videos/queries";

export default async function DashboardConnectionsPage() {
  const t = await getTranslations("dashboard");
  const common = await getTranslations("common");
  const [accountStores, meta, lastDelivery, connectionsVideo] = await Promise.all([
    listAccountStores().catch(() => ({
      stores: [],
      counts: { youcan: 0, woocommerce: 0, shopify: 0 },
    })),
    getMetaConnectionPublicState().catch(() => ({
      provider: "meta" as const,
      status: "not_connected" as const,
    })),
    getLatestMetaDeliverySummary().catch(() => null),
    getVideoForPlacement("connections"),
  ]);

  return (
    <div className="dash-stagger animate-fade-in space-y-8">
      <BackButton href="/dashboard" label={common("back")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("connectionsTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {t("connectionsManageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SectionHelp video={connectionsVideo} />
          <AddStoreDialog counts={accountStores.counts} />
        </div>
      </div>
      <ProviderStatusList
        stores={accountStores.stores}
        meta={{
          connected: meta.status === "connected",
          pixelId: "pixelId" in meta ? meta.pixelId : undefined,
          verificationStatus:
            "verificationStatus" in meta ? meta.verificationStatus : undefined,
          lastDelivery,
        }}
      />
    </div>
  );
}
