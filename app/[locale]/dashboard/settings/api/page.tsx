import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";

export default async function ApiSettingsPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  return (
    <DashboardSection title={nav("api")} description={pages("apiDescription")} backHref="/dashboard/settings">
      <Card title={nav("api")}>
        <p className="font-mono text-sm tracking-widest">•••• •••• ••••</p>
        <p className="mt-3 text-sm text-muted">{pages("apiVisual")}</p>
      </Card>
    </DashboardSection>
  );
}
