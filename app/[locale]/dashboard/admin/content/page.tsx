import { getTranslations } from "next-intl/server";
import { AdminBlockList } from "@/components/admin/views/block-list";
import { DashboardSection } from "@/components/dashboard/section";

export default async function DashboardAdminContentPage() {
  const t = await getTranslations("admin");
  return (
    <DashboardSection title={t("title")} backHref="/dashboard/admin">
      <AdminBlockList />
    </DashboardSection>
  );
}
