import { getTranslations } from "next-intl/server";
import { ProviderStatusList } from "@/components/connections/provider-status-list";
import { BackButton } from "@/components/ui/back-button";
import { getLatestMetaDeliverySummary } from "@/lib/connections/meta-delivery-summary";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";
import { getWooCommerceConnectionPublicState } from "@/lib/integrations/woocommerce";
import { getYouCanConnectionPublicState } from "@/lib/integrations/youcan/session";

export default async function DashboardConnectionsPage() {
  const t = await getTranslations("dashboard");
  const common = await getTranslations("common");
  const [youcan, shopify, woocommerce, meta, lastDelivery] = await Promise.all([
    getYouCanConnectionPublicState().catch(() => ({
      provider: "youcan" as const,
      status: "not_connected" as const,
    })),
    getShopifyConnectionPublicState().catch(() => ({
      provider: "shopify" as const,
      status: "not_connected" as const,
    })),
    getWooCommerceConnectionPublicState().catch(() => ({ connected: false })),
    getMetaConnectionPublicState().catch(() => ({
      provider: "meta" as const,
      status: "not_connected" as const,
    })),
    getLatestMetaDeliverySummary().catch(() => null),
  ]);

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <BackButton href="/dashboard" label={common("back")} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("connectionsTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {t("connectionsManageDescription")}
        </p>
      </div>
      <ProviderStatusList
        providers={[
          {
            id: "youcan",
            connected: youcan.status === "connected",
            target: "storeSlug" in youcan ? youcan.storeSlug : undefined,
            connectHref: "/onboarding/store",
            disconnectPath: "/api/integrations/youcan/disconnect",
          },
          {
            id: "shopify",
            connected: shopify.status === "connected",
            target: "shop" in shopify ? shopify.shop : undefined,
            connectHref: "/onboarding/store",
            disconnectPath: "/api/integrations/shopify/disconnect",
          },
          {
            id: "woocommerce",
            connected: Boolean(woocommerce.connected),
            target: "store_url" in woocommerce ? woocommerce.store_url : undefined,
            connectHref: "/onboarding/store",
            disconnectPath: "/api/integrations/woocommerce/disconnect",
          },
        ]}
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
