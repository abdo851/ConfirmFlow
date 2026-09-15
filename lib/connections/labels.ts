import type { ConnectionStatus, ConnectionType } from "./types";

export function getConnectionStatusLabel(
  type: ConnectionType,
  status: ConnectionStatus,
): string {
  if (status === "not_connected" && type === "confirmation") {
    return "Not configured";
  }

  switch (status) {
    case "not_connected":
      return "Not connected";
    case "connecting":
      return "Connecting";
    case "connected":
      return "Connected";
    case "error":
      return "Error";
  }
}

export type ConnectionStatusBadgeVariant =
  | "default"
  | "muted"
  | "warning"
  | "error";

export function getConnectionStatusVariant(
  status: ConnectionStatus,
): ConnectionStatusBadgeVariant {
  switch (status) {
    case "not_connected":
      return "warning";
    case "connecting":
      return "muted";
    case "connected":
      return "default";
    case "error":
      return "error";
  }
}
