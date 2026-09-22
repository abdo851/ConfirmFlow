import { getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";

export default async function MarketingPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");

  return (
    <DashboardSection title={pages("marketingTitle")} description={pages("marketingDescription")}>
      <NavCards
        items={[
          { href: "/dashboard/marketing/campaigns", title: nav("campaigns"), description: pages("comingSoon") },
          { href: "/dashboard/marketing/audiences", title: nav("audiences"), description: pages("comingSoon") },
          { href: "/dashboard/marketing/templates", title: nav("templates"), description: pages("comingSoon") },
        ]}
      />
    </DashboardSection>
  );
}
