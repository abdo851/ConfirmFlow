import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { WebhooksTable } from "@/components/dashboard/webhooks-table";
import { DashboardSection } from "@/components/dashboard/section";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWebhooksForUser } from "@/lib/dashboard/get-webhooks-for-user";

export default async function WebhooksPage({
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
  const webhooks = await getWebhooksForUser({ owner_id: user.id });

  return (
    <DashboardSection
      title={pages("webhooksTitle")}
      description={pages("webhooksDescription")}
      backHref="/dashboard/connections"
    >
      <WebhooksTable webhooks={webhooks} />
    </DashboardSection>
  );
}
