import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TransactionsPage() {
  const pages = await getTranslations("dashboard.pages");
  return (
    <DashboardSection title={pages("transactionsTitle")} backHref="/dashboard/wallet">
      <EmptyState title={pages("transactionsEmpty")} description={pages("transactionsEmptyBody")} />
    </DashboardSection>
  );
}
