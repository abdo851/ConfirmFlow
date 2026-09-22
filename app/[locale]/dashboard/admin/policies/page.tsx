import { getTranslations } from "next-intl/server";
import { AdminPoliciesEditor } from "@/components/admin/views/policies";
import { DashboardSection } from "@/components/dashboard/section";

export default async function DashboardAdminPoliciesPage() {
  const t = await getTranslations("admin");
  return (
    <DashboardSection title={t("policiesTitle")} backHref="/dashboard/admin">
      <AdminPoliciesEditor />
    </DashboardSection>
  );
}
