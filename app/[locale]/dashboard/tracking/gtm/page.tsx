import { getTranslations } from "next-intl/server";
import { ComingSoonPanel } from "@/components/dashboard/coming-soon-panel";
import { DashboardSection } from "@/components/dashboard/section";

export default async function GtmPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");

  return (
    <DashboardSection title={nav("gtm")} description={pages("comingSoonBody")} backHref="/dashboard/tracking">
      <ComingSoonPanel feature="gtm" />
    </DashboardSection>
  );
}
