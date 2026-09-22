"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { OrderStatusBadge } from "./order-status-badge";

interface OrdersListProps {
  initialOrders: MerchantOrderListItem[];
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  const t = useTranslations("orders");
  const [orders, setOrders] = useState(initialOrders);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(
    null,
  );
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (orders.length === 0) {
    return (
      <Card title={t("emptyTitle")} description={t("emptyDescription")}>
        <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <svg viewBox="0 0 160 96" className="mx-auto mb-4 h-24 w-40 text-muted" aria-hidden>
            <rect x="16" y="18" width="128" height="64" rx="14" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M36 44h52M36 58h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="118" cy="52" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-sm text-muted">{t("emptyDescription")}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {confirmingOrderId ? <Skeleton className="h-1.5 w-full" /> : null}
      {errorMessage ? <Toast tone="danger" role="alert">{errorMessage}</Toast> : null}

      <div className="grid gap-3 md:hidden">
        {orders.map((order) => {
          const customer = formatOrderCustomerContact(order);
          const isConfirming = confirmingOrderId === order.id;
          const confirmDisabled = isConfirmButtonDisabled(confirmingOrderId);
          const showConfirm = shouldShowConfirmButton(order.confirmationStatus);

          return (
            <article key={order.id} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{formatOrderDisplayIdentifier(order)}</p>
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
                    onClick={() => void handleConfirm(order.id)}
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
            {orders.map((order) => {
              const customer = formatOrderCustomerContact(order);
              const isConfirming = confirmingOrderId === order.id;
              const confirmDisabled = isConfirmButtonDisabled(confirmingOrderId);
              const showConfirm = shouldShowConfirmButton(order.confirmationStatus);

              return (
                <tr key={order.id} className="transition-colors duration-150 hover:bg-surface-muted/70">
                  <td className="px-4 py-4 text-sm font-medium">
                    {formatOrderDisplayIdentifier(order)}
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
                        onClick={() => void handleConfirm(order.id)}
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
    </div>
  );
}
