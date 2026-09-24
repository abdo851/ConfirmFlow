import { getTranslations } from "next-intl/server";
import { NavCards } from "@/components/dashboard/nav-cards";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";

export default async function WalletPage() {
  const pages = await getTranslations("dashboard.pages");
  const nav = await getTranslations("navigation.sidebar");

  return (
    <DashboardSection title={pages("walletTitle")} description={pages("walletDescription")}>
      <Card title={pages("balanceLabel")}>
        <p className="text-3xl font-semibold tracking-tight">0</p>
        <p className="mt-2 text-sm text-muted">{pages("zeroBalance")}</p>
      </Card>
      <NavCards
        items={[
          { href: "/dashboard/wallet/transactions", title: nav("transactions"), description: pages("transactionsEmpty"), soon: true },
          { href: "/dashboard/wallet/invoices", title: nav("invoices"), description: pages("invoicesEmpty"), soon: true },
        ]}
      />
    </DashboardSection>
  );
}
