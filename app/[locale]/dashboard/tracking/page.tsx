import { getLocale, getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";
import arTracking from "@/messages/ar/tracking.json";
import enTracking from "@/messages/en/tracking.json";

export default async function TrackingPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  const locale = await getLocale();
  const tracking = locale === "ar" ? arTracking : enTracking;

  return (
    <DashboardSection title={pages("trackingTitle")} description={pages("trackingDescription")}>
      <NavCards
        items={[
          { href: "/dashboard/tracking/pixel", title: nav("pixelSettings"), description: pages("pixelDescription") },
          { href: "/dashboard/tracking/capi", title: nav("capi"), description: pages("capiDescription") },
          { href: "/dashboard/tracking/gtm", title: nav("gtm"), description: pages("trackingDescription") },
          { href: "/dashboard/tracking/tiktok", title: tracking.tiktok.title, description: tracking.tiktok.subtitle },
          { href: "/dashboard/tracking/google", title: tracking.google.title, description: tracking.google.subtitle },
        ]}
      />
    </DashboardSection>
  );
}
