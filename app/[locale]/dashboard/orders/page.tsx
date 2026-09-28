import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { OrdersList } from "@/components/orders";
import { BackButton } from "@/components/ui/back-button";
import { ExportOrdersButton } from "@/components/orders/export-orders-button";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";
import { getOrderProductsForAuthenticatedUser } from "@/lib/orders/get-order-products";
import { parseOrdersListSearchParams } from "@/lib/orders/list-query";

export default async function DashboardOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = (await searchParams) ?? {};
  const query = parseOrdersListSearchParams(raw);
  const t = await getTranslations("orders");
  const common = await getTranslations("common");
  const result = await getOrdersForAuthenticatedUser({
    provider: query.provider,
    status: query.status,
    from: query.from,
    to: query.to,
    productName: query.productName,
    productSku: query.productSku,
    page: query.page,
  });

  if (!result) {
    return redirect({ href: "/login", locale });
  }

  const products = await getOrderProductsForAuthenticatedUser({ provider: query.provider });
  const { orders } = result;

  return (
    <div className="dash-stagger animate-fade-in space-y-8">
      <BackButton href="/dashboard" label={common("back")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl leading-[1.15] font-semibold tracking-tight sm:text-3xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {t("pageDescription")}
          </p>
        </div>
        <ExportOrdersButton />
      </div>
      <OrdersList
        initialOrders={orders}
        total={result.total}
        page={result.page}
        query={query}
        products={products}
      />
    </div>
  );
}
