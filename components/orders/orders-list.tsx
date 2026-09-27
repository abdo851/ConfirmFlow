"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { applyOrderConfirmation } from "@/lib/orders/confirm-client";
import { OrderActionsMenu } from "./order-actions-menu";
import { OrdersPagination } from "./orders-pagination";
import { OrdersToolbar } from "./orders-toolbar";
import {
  formatMoneyMinor,
  formatOrderCustomerContact,
  formatOrderDisplayIdentifier,
} from "@/lib/orders/format";
import {
  ORDER_TABS,
  ordersListHref,
  ordersQueryHasFilters,
  type OrderTab,
  type ResolvedOrdersListQuery,
} from "@/lib/orders/list-query";
import type { MerchantOrderListItem, OrderProvider } from "@/lib/orders/types";
import type { OrderProductOption } from "@/lib/orders/products";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "./order-status-badge";

interface OrdersListProps {
  initialOrders: MerchantOrderListItem[];
  total: number;
  page: number;
  query: ResolvedOrdersListQuery;
  products: OrderProductOption[];
}

const STORE_LOGO: Record<OrderProvider, string> = {
  woocommerce: "/brands/woocommerce.svg",
  youcan: "/brands/youcan.svg",
  shopify: "/brands/shopify.svg",
};

function matchesTab(status: MerchantOrderListItem["confirmationStatus"], tab: OrderTab) {
  if (tab === "all") {
    return true;
  }
  if (tab === "new") {
    return status === "pending";
  }
  return status === tab;
}

export function OrdersList(props: OrdersListProps) {
  return (
    <Suspense fallback={null}>
      <OrdersListBody {...props} />
    </Suspense>
  );
}

function StoreMark({ provider }: { provider: OrderProvider | null }) {
  const t = useTranslations("orders");
  if (!provider) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className="size-4 shrink-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${STORE_LOGO[provider]})` }}
      />
      <span>{t(`stores.${provider}`)}</span>
    </span>
  );
}

function OrdersListBody({ initialOrders, total, page, query, products }: OrdersListProps) {
  const t = useTranslations("orders");
  const [orders, setOrders] = useState(initialOrders);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const router = useRouter();
  const hasFilters = ordersQueryHasFilters(query);

  useEffect(() => {
    setOrders(initialOrders);
    setSuccessOrderId(null);
  }, [initialOrders]);

  const visible = orders.filter((order) => matchesTab(order.confirmationStatus, query.tab));

  return (
    <div className="space-y-5">
      <OrdersToolbar query={query} products={products} />

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t("tabs.label")}>
        {ORDER_TABS.map((item) => {
          const active = query.tab === item;
          return (
            <Link
              key={item}
              href={ordersListHref(query, { tab: item, page: 1 })}
              role="tab"
              aria-selected={active}
              className={`pressable inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${
                active ? "tab-active" : "border border-line bg-surface text-foreground"
              }`}
            >
              {t(`tabs.${item}`)}
            </Link>
          );
        })}
      </div>

      {total === 0 && !hasFilters ? (
        <Card title={t("emptyTitle")} description={t("emptyDescription")}>
          <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        </Card>
      ) : null}

      {total === 0 && hasFilters ? (
        <EmptyState title={t("filterEmptyTitle")} description={t("filterEmptyDescription")} />
      ) : null}

      {total > 0 && visible.length === 0 ? (
        <EmptyState title={t("filterEmptyTitle")} description={t("filterEmptyDescription")} />
      ) : null}

      {visible.length > 0 ? (
        <div className="animate-fade-in grid gap-3 md:hidden">
          {visible.map((order) => {
            const customer = formatOrderCustomerContact(order);
            return (
              <article
                key={order.id}
                className="cursor-pointer rounded-2xl border border-line bg-surface p-4 shadow-soft transition-colors duration-200 hover:bg-indigo-50/40"
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-sm font-semibold underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {formatOrderDisplayIdentifier(order)}
                    </Link>
                    <StoreMark provider={order.provider} />
                  </div>
                  <OrderStatusBadge status={order.confirmationStatus} />
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("columns.customer")}</dt>
                    <dd>{customer ?? t("customerUnavailable")}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("columns.total")}</dt>
                    <dd>{formatMoneyMinor(order.totalAmountMinor, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("columns.received")}</dt>
                    <dd>{new Date(order.receivedAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <OrderActionsMenu
                    orderId={order.id}
                    confirmationStatus={order.confirmationStatus}
                    onConfirmed={(confirmedAt) => {
                      setOrders((current) => applyOrderConfirmation(current, order.id, confirmedAt));
                      setSuccessOrderId(order.id);
                    }}
                  />
                  {successOrderId === order.id ? <Toast tone="success">{t("confirmSuccess")}</Toast> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="animate-fade-in hidden max-h-[min(70vh,52rem)] overflow-auto rounded-2xl border border-line bg-surface shadow-soft md:block">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr>
                {(
                  [
                    ["order", t("columns.order")],
                    ["customer", t("columns.customer")],
                    ["total", t("columns.total")],
                    ["received", t("columns.received")],
                    ["status", t("columns.status")],
                    ["action", t("columns.action")],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="border-b border-line bg-surface-muted px-4 py-3.5 text-start text-xs font-semibold tracking-wide text-muted uppercase"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((order, index) => {
                const customer = formatOrderCustomerContact(order);
                return (
                  <tr
                    key={order.id}
                    className={`cursor-pointer transition-colors duration-200 hover:bg-indigo-50/70 dark:hover:bg-white/5 ${
                      index % 2 === 1 ? "bg-slate-50/80 dark:bg-white/[0.03]" : "bg-surface"
                    }`}
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <td className="border-b border-line/80 px-4 py-4 text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {formatOrderDisplayIdentifier(order)}
                        </Link>
                        <StoreMark provider={order.provider} />
                      </div>
                    </td>
                    <td className="border-b border-line/80 px-4 py-4 text-sm text-muted">
                      {customer ?? t("customerUnavailable")}
                    </td>
                    <td className="border-b border-line/80 px-4 py-4 text-sm">
                      {formatMoneyMinor(order.totalAmountMinor, order.currency)}
                    </td>
                    <td className="border-b border-line/80 px-4 py-4 text-sm text-muted">
                      {new Date(order.receivedAt).toLocaleString()}
                    </td>
                    <td className="border-b border-line/80 px-4 py-4">
                      <OrderStatusBadge status={order.confirmationStatus} />
                    </td>
                    <td className="border-b border-line/80 px-4 py-4">
                      <OrderActionsMenu
                        orderId={order.id}
                        confirmationStatus={order.confirmationStatus}
                        onConfirmed={(confirmedAt) => {
                          setOrders((current) => applyOrderConfirmation(current, order.id, confirmedAt));
                          setSuccessOrderId(order.id);
                        }}
                      />
                      {successOrderId === order.id ? <Toast tone="success">{t("confirmSuccess")}</Toast> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {total > 0 ? <OrdersPagination query={query} total={total} page={page} /> : null}
    </div>
  );
}
