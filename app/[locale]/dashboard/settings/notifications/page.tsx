import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";

export default async function NotificationSettingsPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");
  return (
    <DashboardSection title={nav("notifications")} description={pages("notificationsDescription")} backHref="/dashboard/settings">
      <Card title={nav("notifications")}>
        <p className="text-sm text-muted">{pages("notificationsVisual")}</p>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" disabled className="size-4" />
          {pages("orderAlerts")}
        </label>
      </Card>
    </DashboardSection>
  );
}
