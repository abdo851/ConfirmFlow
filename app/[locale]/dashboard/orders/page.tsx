import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { OrdersList } from "@/components/orders";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";

export default async function DashboardOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("orders");
  const result = await getOrdersForAuthenticatedUser();

  if (!result) {
    return redirect({ href: "/login", locale });
  }

  const { orders } = result;

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {t("pageDescription")}
        </p>
      </div>
      <OrdersList initialOrders={orders} />
    </div>
  );
}
