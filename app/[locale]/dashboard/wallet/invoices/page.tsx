import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { EmptyState } from "@/components/ui/empty-state";

export default async function InvoicesPage() {
  const pages = await getTranslations("dashboard.pages");
  return (
    <DashboardSection title={pages("invoicesTitle")} backHref="/dashboard/wallet">
      <EmptyState title={pages("invoicesEmpty")} description={pages("invoicesEmptyBody")} />
    </DashboardSection>
  );
}
