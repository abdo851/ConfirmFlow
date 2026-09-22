import { getTranslations } from "next-intl/server";
import { MetaStatusCard } from "@/components/dashboard/meta-status-card";
import { DashboardSection } from "@/components/dashboard/section";
import { getLatestMetaDeliverySummary } from "@/lib/connections/meta-delivery-summary";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export default async function PixelPage() {
  const pages = await getTranslations("dashboard.pages");
  const [meta, lastDelivery] = await Promise.all([
    getMetaConnectionPublicState().catch(() => ({
      provider: "meta" as const,
      status: "not_connected" as const,
    })),
    getLatestMetaDeliverySummary().catch(() => null),
  ]);

  return (
    <DashboardSection title={pages("pixelTitle")} description={pages("pixelDescription")} backHref="/dashboard/tracking">
      <MetaStatusCard
        connected={meta.status === "connected"}
        pixelId={"pixelId" in meta ? meta.pixelId : undefined}
        verificationStatus={"verificationStatus" in meta ? meta.verificationStatus : undefined}
        lastDelivery={lastDelivery}
      />
    </DashboardSection>
  );
}
