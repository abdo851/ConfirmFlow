/**
 * Application database entity types for the M2-C2 MVP schema.
 * Mirrors database/migrations/002_mvp_database_foundation.sql
 */

export type StorePlatform = "shopify";
export type StoreStatus = "pending" | "active" | "inactive";
export type StoreConnectionType = "store" | "confirmation" | "marketing";
export type StoreConnectionStatus =
  | "inactive"
  | "connecting"
  | "active"
  | "error";

export type WebhookIngestionStatus =
  | "accepted"
  | "ignored"
  | "unsupported"
  | "duplicate"
  | "rejected";

export type WebhookProvider = "shopify";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  platform: StorePlatform;
  external_store_id: string | null;
  status: StoreStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreConnection {
  id: string;
  store_id: string;
  connection_type: StoreConnectionType;
  provider: string;
  status: StoreConnectionStatus;
  created_at: string;
  updated_at: string;
}

/** Public Shopify connection metadata — no access tokens */
export interface ShopifyConnection {
  store_connection_id: string;
  shop_domain: string;
  scope: string | null;
  connected_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/** Server-only encrypted token storage */
export interface ShopifyConnectionSecret {
  store_connection_id: string;
  encrypted_access_token: string;
  created_at: string;
  updated_at: string;
}

/** Server-only webhook ingestion record — no raw payload storage */
export interface StoreWebhookEvent {
  id: string;
  store_id: string;
  provider: WebhookProvider;
  external_event_id: string;
  topic: string;
  shop_domain: string;
  status: WebhookIngestionStatus;
  payload_hash: string;
  received_at: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
