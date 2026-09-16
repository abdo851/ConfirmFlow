import type { ConnectionStatus } from "@/lib/connections";
import type { StoreConnectionStatus } from "@/database/types";

const UI_TO_DB: Record<ConnectionStatus, StoreConnectionStatus> = {
  not_connected: "inactive",
  connecting: "connecting",
  connected: "active",
  error: "error",
};

const DB_TO_UI: Record<StoreConnectionStatus, ConnectionStatus> = {
  inactive: "not_connected",
  connecting: "connecting",
  active: "connected",
  error: "error",
};

export function toStoreConnectionStatus(
  uiStatus: ConnectionStatus,
): StoreConnectionStatus {
  return UI_TO_DB[uiStatus];
}

export function toConnectionStatus(
  dbStatus: StoreConnectionStatus,
): ConnectionStatus {
  return DB_TO_UI[dbStatus];
}
