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
  orderNumber: string;
  status: OrderConfirmationStatus;
  metaFailed: boolean;
  wooAdminUrl: string | null;
}

export function OrderDetailActions({
  orderId,
  orderNumber,
  status,
  metaFailed,
  wooAdminUrl,
}: OrderDetailActionsProps) {
  const t = useTranslations("orders");
  const pages = useTranslations("dashboard.pages.features.timeline");
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  async function confirm() {
    setPending("confirm");
    const result = await confirmOrderRequest(orderId);
    setPending(null);
    if (!result.ok) {
      setOk(false);
      setMessage(t(`errors.${result.errorKey}`));
      return;
    }
    router.refresh();
  }

  async function reject() {
    setPending("reject");
    await rejectOrderAction(orderId);
    setPending(null);
    router.refresh();
  }

  async function archive() {
    setPending("archive");
    await archiveOrderAction(orderId);
    setPending(null);
    router.refresh();
  }

  async function resend() {
    setPending("meta");
    const response = await fetch("/api/orders/meta-delivery/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    setOk(response.ok);
    setMessage(body?.message || (response.ok ? pages("resent") : pages("resendFailed")));
    setPending(null);
    router.refresh();
  }

  async function copyNumber() {
    await navigator.clipboard.writeText(orderNumber);
    setOk(true);
    setMessage(pages("copied"));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <Button type="button" loading={pending === "confirm"} disabled={pending !== null} onClick={() => void confirm()}>
            {pages("confirm")}
          </Button>
        ) : null}
        {status === "pending" ? (
          <Button type="button" variant="outline" loading={pending === "reject"} disabled={pending !== null} onClick={() => void reject()}>
            {pages("reject")}
          </Button>
        ) : null}
        {status === "confirmed" || status === "rejected" ? (
          <Button type="button" variant="outline" loading={pending === "archive"} disabled={pending !== null} onClick={() => void archive()}>
            {pages("archive")}
          </Button>
        ) : null}
        {metaFailed ? (
          <Button type="button" variant="outline" loading={pending === "meta"} disabled={pending !== null} onClick={() => void resend()}>
            {pages("resendMeta")}
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => void copyNumber()}>
          {pages("copyNumber")}
        </Button>
        {wooAdminUrl ? (
          <a
            href={wooAdminUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium"
          >
            {pages("openWoo")}
          </a>
        ) : null}
      </div>
      {message ? <Toast tone={ok ? "success" : "danger"}>{message}</Toast> : null}
    </div>
  );
}
