import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { OrderDetailActions } from "@/components/orders/order-detail-actions";
import { OrderStatusBadge } from "@/components/orders";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { formatMoneyMinor, formatOrderDisplayIdentifier } from "@/lib/orders/format";
import { getOrderForAuthenticatedUser } from "@/lib/orders/get-order-for-user";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const order = await getOrderForAuthenticatedUser(id);
  if (!order) {
    notFound();
  }

  const t = await getTranslations("orders");
  const common = await getTranslations("common");

  return (
    <div className="animate-fade-in space-y-6">
      <BackButton href="/dashboard/orders" label={common("back")} />
      <Card title={formatOrderDisplayIdentifier(order)} description={t("detailDescription")}>
        <div className="mb-4">
          <OrderStatusBadge status={order.confirmationStatus} />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("source")}</dt>
            <dd className="font-medium">{order.provider}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("columns.customer")}</dt>
            <dd className="font-medium">{order.customerEmail ?? t("customerUnavailable")}</dd>
            <dd className="text-muted">{order.customerPhone ?? t("customerUnavailable")}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("columns.total")}</dt>
            <dd className="font-medium">{formatMoneyMinor(order.totalAmountMinor, order.currency)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("created")}</dt>
            <dd className="font-medium">{new Date(order.createdAt).toLocaleString(locale)}</dd>
          </div>
        </dl>
        <ol className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <li>
            {t("timeline.received")} · {new Date(order.receivedAt).toLocaleString(locale)}
          </li>
          {order.confirmedAt ? (
            <li>
              {t("timeline.confirmed")} · {new Date(order.confirmedAt).toLocaleString(locale)}
            </li>
          ) : null}
        </ol>
        <div className="mt-6">
          <OrderDetailActions orderId={order.id} status={order.confirmationStatus} />
        </div>
      </Card>
    </div>
  );
}
