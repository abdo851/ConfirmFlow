import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";

export default async function LanguageSettingsPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  return (
    <DashboardSection title={nav("language")} description={pages("languageDescription")} backHref="/dashboard/settings">
      <Card title={nav("language")}>
        <LanguageSwitcher />
      </Card>
    </DashboardSection>
  );
}
