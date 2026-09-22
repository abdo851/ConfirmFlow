import { getTranslations } from "next-intl/server";
import { MetaStatusCard } from "@/components/dashboard/meta-status-card";
import { MetaVerifyButton } from "@/components/dashboard/meta-verify-button";
import { DashboardSection } from "@/components/dashboard/section";
import { getLatestMetaDeliverySummary } from "@/lib/connections/meta-delivery-summary";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export default async function CapiPage() {
  const pages = await getTranslations("dashboard.pages");
  const [meta, lastDelivery] = await Promise.all([
    getMetaConnectionPublicState().catch(() => ({
      provider: "meta" as const,
      status: "not_connected" as const,
    })),
    getLatestMetaDeliverySummary().catch(() => null),
  ]);

  return (
    <DashboardSection title={pages("capiTitle")} description={pages("capiDescription")} backHref="/dashboard/tracking">
      <MetaStatusCard
        connected={meta.status === "connected"}
        pixelId={"pixelId" in meta ? meta.pixelId : undefined}
        verificationStatus={"verificationStatus" in meta ? meta.verificationStatus : undefined}
        lastDelivery={lastDelivery}
        showTest
        testSlot={<MetaVerifyButton />}
      />
    </DashboardSection>
  );
}
