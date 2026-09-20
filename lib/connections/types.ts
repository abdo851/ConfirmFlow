/**
 * Generic connection state model for Confirma integrations.
 * Provider-specific types belong in future integration milestones.
 */

export type ConnectionType = "store" | "meta" | "confirmation";

export type ConnectionStatus =
  | "not_connected"
  | "connecting"
  | "connected"
  | "error";

export interface ConnectionMetadata {
  /** Optional provider identifier for future use (e.g. shopify, meta) */
  provider?: string;
  /** Optional connected shop domain for store integrations */
  shopDomain?: string;
  /** Optional connected store slug for YouCan integrations */
  storeSlug?: string;
  /** Optional human-readable error when status is error */
  errorMessage?: string;
}

export interface ConnectionState {
  type: ConnectionType;
  status: ConnectionStatus;
  label: string;
  description: string;
  metadata?: ConnectionMetadata;
}
