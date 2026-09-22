import { getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";

export default async function SettingsPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  return (
    <DashboardSection title={pages("settingsTitle")} description={pages("settingsDescription")}>
      <NavCards
        items={[
          { href: "/dashboard/settings/account", title: nav("account"), description: pages("accountDescription") },
          { href: "/dashboard/settings/language", title: nav("language"), description: pages("languageDescription") },
          { href: "/dashboard/settings/notifications", title: nav("notifications"), description: pages("notificationsDescription") },
          { href: "/dashboard/settings/api", title: nav("api"), description: pages("apiDescription") },
        ]}
      />
    </DashboardSection>
  );
}
