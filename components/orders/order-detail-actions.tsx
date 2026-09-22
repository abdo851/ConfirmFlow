"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { archiveOrderAction, rejectOrderAction } from "@/lib/confirmation/order-actions";
import { confirmOrderRequest } from "@/lib/orders/confirm-client";
import type { OrderConfirmationStatus } from "@/lib/orders/types";

interface OrderDetailActionsProps {
  orderId: string;
  status: OrderConfirmationStatus;
}

export function OrderDetailActions({ orderId, status }: OrderDetailActionsProps) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [pending, setPending] = useState<"confirm" | "reject" | "archive" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending("confirm");
    setError(null);
    const result = await confirmOrderRequest(orderId);
    setPending(null);
    if (!result.ok) {
      setError(t(`errors.${result.errorKey}`));
      return;
    }
    router.refresh();
  }

  async function reject() {
    setPending("reject");
    setError(null);
    await rejectOrderAction(orderId);
    setPending(null);
    router.refresh();
  }

  async function archive() {
    setPending("archive");
    setError(null);
    await archiveOrderAction(orderId);
    setPending(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" ? (
        <Button type="button" loading={pending === "confirm"} disabled={pending !== null} onClick={() => void confirm()}>
          {t("confirmShort")}
        </Button>
      ) : null}
      {status === "pending" ? (
        <Button type="button" variant="outline" loading={pending === "reject"} disabled={pending !== null} onClick={() => void reject()}>
          {t("rejectOrder")}
        </Button>
      ) : null}
      {status === "confirmed" || status === "rejected" ? (
        <Button type="button" variant="outline" loading={pending === "archive"} disabled={pending !== null} onClick={() => void archive()}>
          {t("archiveOrder")}
        </Button>
      ) : null}
      {error ? <Toast tone="danger">{error}</Toast> : null}
    </div>
  );
}
