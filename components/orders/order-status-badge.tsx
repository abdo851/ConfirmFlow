"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getOrderStatusBadgeVariant } from "@/lib/orders/confirm-client";
import type { OrderConfirmationStatus } from "@/lib/orders/types";

interface OrderStatusBadgeProps {
  status: OrderConfirmationStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const t = useTranslations("orders.status");

  const variant = getOrderStatusBadgeVariant(status);
  const label = t(status);

  return (
    <Badge
      variant={status === "confirmed" ? "success" : variant}
      dot
      pulse={status === "confirmed"}
    >
      {label}
    </Badge>
  );
}
