"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import {
  applyOrderConfirmation,
  confirmOrderRequest,
  isConfirmButtonDisabled,
  shouldShowConfirmButton,
} from "@/lib/orders/confirm-client";
import {
  formatMoneyMinor,
  formatOrderCustomerContact,
  formatOrderDisplayIdentifier,
} from "@/lib/orders/format";
import type { MerchantOrderListItem } from "@/lib/orders/types";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "./order-status-badge";

interface OrdersListProps {
  initialOrders: MerchantOrderListItem[];
}

const TABS = ["all", "new", "confirmed", "rejected", "archived"] as const;
type OrderTab = (typeof TABS)[number];
const PAGE_SIZE = 8;

function matchesTab(status: MerchantOrderListItem["confirmationStatus"], tab: OrderTab) {
  if (tab === "all") {
    return true;
  }
  if (tab === "new") {
    return status === "pending";
  }
  if (tab === "confirmed") {
    return status === "confirmed";
  }
  if (tab === "rejected") {
    return status === "rejected";
  }
  if (tab === "archived") {
    return status === "archived";
  }
  return false;
}

function statusToTab(status: string | null): OrderTab {
  if (status === "confirmed" || status === "rejected" || status === "archived") {
    return status;
  }
  if (status === "pending") {
    return "new";
  }
  return "all";
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  return (
    <Suspense fallback={null}>
      <OrdersListBody initialOrders={initialOrders} />
    </Suspense>
  );
}

function OrdersListBody({ initialOrders }: OrdersListProps) {
  const t = useTranslations("orders");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [orders, setOrders] = useState(initialOrders);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(
    null,
  );
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<OrderTab>(statusToTab(status));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();

  useEffect(() => {
    setTab(statusToTab(status));
    setVisibleCount(PAGE_SIZE);
  }, [status]);

  async function handleConfirm(orderId: string) {
    if (confirmingOrderId) {
      return;
    }

    setConfirmingOrderId(orderId);
    setErrorMessage(null);
    setSuccessOrderId(null);

    const result = await confirmOrderRequest(orderId);

    if (result.ok) {
      setOrders((current) =>
        applyOrderConfirmation(current, orderId, result.confirmedAt),
      );
      setSuccessOrderId(orderId);
    } else {
      setErrorMessage(t(`errors.${result.errorKey}`));
    }

    setConfirmingOrderId(null);
  }

  const filtered = orders.filter((order) => matchesTab(order.confirmationStatus, tab));
  const visible = filtered.slice(0, visibleCount);

  if (orders.length === 0) {
    return (
      <Card title={t("emptyTitle")} description={t("emptyDescription")}>
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {confirmingOrderId ? <Skeleton className="h-1.5 w-full" /> : null}
      {errorMessage ? <Toast tone="danger" role="alert">{errorMessage}</Toast> : null}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((item) => {
          const count =
            item === "all"
              ? orders.length
              : orders.filter((order) => matchesTab(order.confirmationStatus, item)).length;
          const active = tab === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              className={`pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium ${
                active ? "tab-active" : "border border-line bg-surface text-foreground"
              }`}
              onClick={() => {
                setTab(item);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {t(`tabs.${item}`)}
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-surface-muted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t("filterEmpty")} description={t("emptyDescription")} />
      ) : null}

      <div className="grid gap-3 md:hidden">
        {visible.map((order) => {
          const customer = formatOrderCustomerContact(order);
          const isConfirming = confirmingOrderId === order.id;
          const confirmDisabled = isConfirmButtonDisabled(confirmingOrderId);
          const showConfirm = shouldShowConfirmButton(order.confirmationStatus);

          return (
            <article
              key={order.id}
              className="cursor-pointer rounded-2xl border border-line bg-surface p-4 shadow-soft"
              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-sm font-semibold underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {formatOrderDisplayIdentifier(order)}
                </Link>
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
                {showConfirm ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    loading={isConfirming}
                    disabled={isConfirming || confirmDisabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleConfirm(order.id);
                    }}
                  >
                    {isConfirming ? t("confirming") : t("confirmOrder")}
                  </Button>
                ) : successOrderId === order.id ? (
                  <Toast tone="success">{t("confirmSuccess")}</Toast>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft md:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="sticky top-0 bg-surface-muted">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.order")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.customer")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.total")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.received")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.status")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">
                {t("columns.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((order) => {
              const customer = formatOrderCustomerContact(order);
              const isConfirming = confirmingOrderId === order.id;
              const confirmDisabled = isConfirmButtonDisabled(confirmingOrderId);
              const showConfirm = shouldShowConfirmButton(order.confirmationStatus);

              return (
                <tr
                  key={order.id}
                  className="cursor-pointer transition-colors duration-150 hover:bg-surface-muted/70"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <td className="px-4 py-4 text-sm font-medium">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {formatOrderDisplayIdentifier(order)}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">
                    {customer ?? t("customerUnavailable")}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {formatMoneyMinor(order.totalAmountMinor, order.currency)}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">
                    {new Date(order.receivedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={order.confirmationStatus} />
                  </td>
                  <td className="px-4 py-4">
                    {showConfirm ? (
                      <Button
                        type="button"
                        variant="outline"
                        loading={isConfirming}
                        disabled={isConfirming || confirmDisabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleConfirm(order.id);
                        }}
                      >
                        {isConfirming ? t("confirming") : t("confirmOrder")}
                      </Button>
                    ) : successOrderId === order.id ? (
                      <Toast tone="success">{t("confirmSuccess")}</Toast>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > visible.length ? (
        <button
          type="button"
          className="pressable min-h-11 rounded-xl border border-line px-4 text-sm font-medium"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          {t("loadMore")}
        </button>
      ) : null}
    </div>
  );
}
