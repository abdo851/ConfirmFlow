import { getTranslations } from "next-intl/server";
import { AdminBlockList } from "@/components/admin/views/block-list";
import { DashboardSection } from "@/components/dashboard/section";

export default async function DashboardAdminPage() {
  const t = await getTranslations("admin");
  return (
    <DashboardSection title={t("title")} backHref="/dashboard">
      <AdminBlockList />
    </DashboardSection>
  );
}
