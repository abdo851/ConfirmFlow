import { getTranslations } from "next-intl/server";
import { ComingSoonPanel } from "@/components/dashboard/coming-soon-panel";
import { DashboardSection } from "@/components/dashboard/section";

export default async function TikTokPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");

  return (
    <DashboardSection title={nav("tiktok")} description={pages("comingSoonBody")} backHref="/dashboard/tracking">
      <ComingSoonPanel feature="tiktok" />
    </DashboardSection>
  );
}
