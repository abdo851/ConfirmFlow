"use client";

import { useTranslations } from "next-intl";
import type { OrderConfirmationStatus } from "@/lib/orders/types";

interface OrderStatusBadgeProps {
  status: OrderConfirmationStatus;
}

const softTones: Record<OrderConfirmationStatus, string> = {
  pending: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-100",
  confirmed: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  rejected: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-100",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
};

const softDots: Record<OrderConfirmationStatus, string> = {
  pending: "bg-sky-500",
  confirmed: "bg-emerald-500",
  rejected: "bg-rose-500",
  archived: "bg-slate-400",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const t = useTranslations("orders.status");
  const label = t(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${softTones[status]}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${softDots[status]}`} />
      {label}
    </span>
  );
}
