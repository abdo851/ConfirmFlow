import { getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";

export default async function TrackingPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");

  return (
    <DashboardSection title={pages("trackingTitle")} description={pages("trackingDescription")}>
      <NavCards
        items={[
          { href: "/dashboard/tracking/pixel", title: nav("pixelSettings"), description: pages("pixelDescription") },
          { href: "/dashboard/tracking/capi", title: nav("capi"), description: pages("capiDescription") },
          { href: "/dashboard/tracking/gtm", title: nav("gtm"), description: pages("comingSoon"), soon: true },
          { href: "/dashboard/tracking/tiktok", title: nav("tiktok"), description: pages("comingSoon"), soon: true },
        ]}
      />
    </DashboardSection>
  );
}
