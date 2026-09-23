import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { OrderDetailActions } from "@/components/orders/order-detail-actions";
import { OrderStatusBadge } from "@/components/orders";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getMetaDeliveryForOrder } from "@/lib/dashboard/get-meta-deliveries-for-user";
import { getWooAdminUrlForOwner } from "@/lib/dashboard/get-woo-admin-url";
import { buildOrderTimeline } from "@/lib/dashboard/order-timeline";
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

  const [delivery, wooAdminUrl] = await Promise.all([
    getMetaDeliveryForOrder(order.id),
    order.provider === "woocommerce" ? getWooAdminUrlForOwner(order.externalOrderId) : Promise.resolve(null),
  ]);
  const t = await getTranslations("orders");
  const pages = await getTranslations("dashboard.pages.features.timeline");
  const common = await getTranslations("common");
  const label = formatOrderDisplayIdentifier(order);
  const events = buildOrderTimeline({
    receivedAt: order.receivedAt,
    confirmedAt: order.confirmedAt,
    metaAttemptedAt: delivery?.last_attempted_at ?? null,
    metaStatus: delivery?.status ?? null,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <BackButton href="/dashboard/orders" label={common("back")} />
      <Card title={label} description={t("detailDescription")}>
        <div className="mb-4">
          <OrderStatusBadge status={order.confirmationStatus} />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{pages("provider")}</dt>
            <dd className="font-medium">{order.provider}</dd>
          </div>
          <div>
            <dt className="text-muted">{pages("externalId")}</dt>
            <dd className="font-medium">{order.externalOrderId}</dd>
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
        </dl>
        <div className="mt-6 border-t border-line pt-4">
          <h2 className="mb-4 text-sm font-semibold">{pages("title")}</h2>
          <OrderTimeline
            events={events}
            labels={{
              received: pages("received"),
              confirmed: pages("confirmed"),
              meta: pages("metaDelivery"),
            }}
          />
          {!delivery ? <p className="mt-3 text-sm text-muted">{pages("metaNotSent")}</p> : null}
        </div>
        <div className="mt-6">
          <OrderDetailActions
            orderId={order.id}
            orderNumber={label}
            status={order.confirmationStatus}
            metaFailed={delivery?.status === "failed"}
            wooAdminUrl={wooAdminUrl}
          />
        </div>
      </Card>
    </div>
  );
}
