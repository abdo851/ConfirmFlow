import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { CustomCarrierManager } from "@/components/shipping/custom-carrier-manager";
import type { CustomCarrierPublic } from "@/lib/integrations/shipping/custom/public";
import { listCustomCarriers } from "@/lib/integrations/shipping/custom/store";

export default async function CustomCarrierPage() {
  const t = await getTranslations("dashboard.customCarrier");
  const common = await getTranslations("common");
  let carriers: CustomCarrierPublic[] = [];
  let storageReady = true;
  try {
    carriers = await listCustomCarriers();
  } catch {
    storageReady = false;
  }

  return (
    <div className="dash-stagger animate-fade-in space-y-8">
      <BackButton href="/dashboard/shipping" label={common("back")} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{t("subtitle")}</p>
      </div>
      <CustomCarrierManager initialCarriers={carriers} storageReady={storageReady} />
    </div>
  );
}
