import { getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";

export default async function AdminSettingsPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  return (
    <DashboardSection title={pages("adminSettingsTitle")} description={pages("adminSettingsBody")} backHref="/dashboard/admin">
      <NavCards
        items={[
          { href: "/dashboard/admin/policies", title: nav("policies"), description: pages("adminSettingsBody") },
          { href: "/dashboard/admin/content", title: nav("cms"), description: pages("adminSettingsBody") },
        ]}
      />
    </DashboardSection>
  );
}
