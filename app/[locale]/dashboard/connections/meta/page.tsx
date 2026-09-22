import { getTranslations } from "next-intl/server";
import { MetaProviderPanel } from "@/components/connections/meta-provider-panel";
import { MetaStatusCard } from "@/components/dashboard/meta-status-card";
import { DashboardSection } from "@/components/dashboard/section";
import { getLatestMetaDeliverySummary } from "@/lib/connections/meta-delivery-summary";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export default async function MetaConnectionPage() {
  const pages = await getTranslations("dashboard.pages");
  const [meta, lastDelivery] = await Promise.all([
    getMetaConnectionPublicState().catch(() => ({
      provider: "meta" as const,
      status: "not_connected" as const,
    })),
    getLatestMetaDeliverySummary().catch(() => null),
  ]);
  const connected = meta.status === "connected";

  return (
    <DashboardSection title={pages("metaTitle")} description={pages("metaDescription")} backHref="/dashboard/connections">
      <MetaStatusCard
        connected={connected}
        pixelId={"pixelId" in meta ? meta.pixelId : undefined}
        verificationStatus={"verificationStatus" in meta ? meta.verificationStatus : undefined}
        lastDelivery={lastDelivery}
      />
      {connected ? null : <MetaProviderPanel />}
    </DashboardSection>
  );
}
