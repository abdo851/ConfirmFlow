import { Badge } from "@/components/ui/badge";
import {
  getConnectionStatusLabel,
  getConnectionStatusVariant,
  type ConnectionStatus,
  type ConnectionType,
} from "@/lib/connections";

interface ConnectionStatusBadgeProps {
  type: ConnectionType;
  status: ConnectionStatus;
}

const errorBadgeClasses =
  "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200";

export function ConnectionStatusBadge({
  type,
  status,
}: ConnectionStatusBadgeProps) {
  const label = getConnectionStatusLabel(type, status);
  const variant = getConnectionStatusVariant(status);

  if (variant === "error") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${errorBadgeClasses}`}
      >
        {label}
      </span>
    );
  }

  return <Badge variant={variant}>{label}</Badge>;
}
