import { getTranslations } from "next-intl/server";
import { AdminEditBlock } from "@/components/admin/views/edit-block";
import { DashboardSection } from "@/components/dashboard/section";

export default async function DashboardEditBlockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  return (
    <DashboardSection title={t("editTitle")} backHref="/dashboard/admin/content">
      <AdminEditBlock id={id} />
    </DashboardSection>
  );
}
