"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getConnectionStatusVariant } from "@/lib/connections/labels";
import type { ConnectionStatus, ConnectionType } from "@/lib/connections/types";

interface ConnectionStatusBadgeProps {
  type: ConnectionType;
  status: ConnectionStatus;
}

export function ConnectionStatusBadge({
  type,
  status,
}: ConnectionStatusBadgeProps) {
  const t = useTranslations("connections.status");
  const label =
    status === "not_connected" && type === "confirmation"
      ? t("not_configured")
      : t(status);
  const variant = getConnectionStatusVariant(status);

  if (status === "connected") {
    return (
      <Badge variant="success" dot pulse>
        {label}
      </Badge>
    );
  }

  if (variant === "error") {
    return (
      <Badge variant="danger" dot>
        {label}
      </Badge>
    );
  }

  return <Badge variant={variant}>{label}</Badge>;
}
