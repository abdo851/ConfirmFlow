import { getTranslations } from "next-intl/server";
import { AdminNewBlock } from "@/components/admin/views/new-block";
import { DashboardSection } from "@/components/dashboard/section";

export default async function DashboardNewBlockPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const query = await searchParams;
  const t = await getTranslations("admin");
  return (
    <DashboardSection title={t("newTitle")} backHref="/dashboard/admin/content">
      <AdminNewBlock type={query.type} />
    </DashboardSection>
  );
}
