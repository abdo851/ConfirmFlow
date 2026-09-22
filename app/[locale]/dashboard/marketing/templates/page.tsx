import { getTranslations } from "next-intl/server";
import { ComingSoonPanel } from "@/components/dashboard/coming-soon-panel";
import { DashboardSection } from "@/components/dashboard/section";

export default async function TemplatesPage() {
  const nav = await getTranslations("navigation.sidebar");
  const pages = await getTranslations("dashboard.pages");
  return (
    <DashboardSection title={nav("templates")} description={pages("comingSoonBody")} backHref="/dashboard/marketing">
      <ComingSoonPanel feature="templates" />
    </DashboardSection>
  );
}
