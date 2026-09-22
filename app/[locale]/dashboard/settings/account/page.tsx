import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }
  const pages = await getTranslations("dashboard.pages");

  return (
    <DashboardSection title={pages("accountTitle")} description={pages("accountDescription")} backHref="/dashboard/settings">
      <Card title={pages("accountEmail")}>
        <p className="text-sm font-medium">{user.email}</p>
        <p className="mt-3 text-sm text-muted">{pages("accountVisual")}</p>
      </Card>
    </DashboardSection>
  );
}
