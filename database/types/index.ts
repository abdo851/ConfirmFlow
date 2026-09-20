/**
 * Application database entity types for the M2-C2 MVP schema.
 * Mirrors database/migrations/002_mvp_database_foundation.sql
 */

export type StorePlatform = "shopify" | "youcan";
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

export type WebhookProvider = "shopify" | "youcan";
export type OrderProvider = "shopify" | "youcan";
export type OrderConfirmationStatus = "pending" | "confirmed";

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

/** Public YouCan connection metadata — no access tokens */
export interface YouCanConnection {
  store_connection_id: string;
  store_slug: string;
  youcan_store_id: string | null;
  scope: string | null;
  connected_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/** Server-only encrypted YouCan token storage */
export interface YouCanConnectionSecret {
  store_connection_id: string;
  encrypted_access_token: string;
  created_at: string;
  updated_at: string;
}

/** Public Meta connection metadata — no access tokens */
export interface MetaConnection {
  store_connection_id: string;
  pixel_id: string;
  connected_at: string | null;
  verification_status:
    | "unverified"
    | "verified"
    | "credentials_valid"
    | "identifier_not_verified"
    | "failed";
  verified_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/** Meta Purchase delivery record — no access tokens or raw responses */
export interface MetaConversionDelivery {
  id: string;
  store_id: string;
  order_id: string;
  provider: "meta";
  event_type: "Purchase";
  event_id: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_attempted_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Server-only encrypted Meta token storage */
export interface MetaConnectionSecret {
  store_connection_id: string;
  encrypted_access_token: string;
  created_at: string;
  updated_at: string;
}

/** Normalized order — no raw provider payload */
export interface Order {
  id: string;
  store_id: string;
  owner_id: string;
  provider: OrderProvider;
  external_order_id: string;
  order_number: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  currency: string;
  subtotal_amount_minor: number;
  total_amount_minor: number;
  financial_status: string | null;
  confirmation_status: OrderConfirmationStatus;
  confirmed_at: string | null;
  provider_created_at: string | null;
  received_at: string;
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
