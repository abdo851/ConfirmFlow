"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <div className="rounded-md border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("emptyDescription")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-950">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("columns.order")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("columns.customer")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("columns.total")}
              </th>
              <th className="hidden px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:table-cell">
                {t("columns.received")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("columns.status")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("columns.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
            {orders.map((order) => {
              const customer = formatOrderCustomerContact(order);
              const isConfirming = confirmingOrderId === order.id;
              const confirmDisabled = isConfirmButtonDisabled(confirmingOrderId);
              const showConfirm = shouldShowConfirmButton(order.confirmationStatus);

              return (
                <tr key={order.id}>
                  <td className="px-4 py-4 text-sm font-medium">
                    {formatOrderDisplayIdentifier(order)}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {customer ?? t("customerUnavailable")}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {formatMoneyMinor(order.totalAmountMinor, order.currency)}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-neutral-600 dark:text-neutral-400 sm:table-cell">
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
                        disabled={isConfirming || confirmDisabled}
                        onClick={() => void handleConfirm(order.id)}
                      >
                        {isConfirming ? t("confirming") : t("confirmOrder")}
                      </Button>
                    ) : successOrderId === order.id ? (
                      <p className="text-sm text-green-700 dark:text-green-400" role="status">
                        {t("confirmSuccess")}
                      </p>
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
