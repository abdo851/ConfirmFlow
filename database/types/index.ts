/**
 * Application database entity types.
 * These mirror the initial schema defined in database/migrations/001_initial_schema.sql
 */

export type StorePlatform = "shopify" | "woocommerce" | "youcan";
export type StoreStatus = "pending" | "active" | "inactive";
export type IntegrationType = "store" | "confirmation" | "marketing";
export type IntegrationStatus = "inactive" | "active" | "error";
export type ConfirmationStatus = "pending" | "confirmed" | "cancelled";
export type ConversionPlatform = "meta" | "google" | "tiktok";
export type ConversionStatus = "pending" | "sent" | "failed" | "skipped";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled";

export interface User {
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

export interface Integration {
  id: string;
  store_id: string;
  type: IntegrationType;
  provider: string;
  config: Record<string, unknown>;
  status: IntegrationStatus;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  external_customer_id: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  external_order_id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  confirmation_status: ConfirmationStatus;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  idempotency_key: string | null;
  created_at: string;
}

export interface ConversionEvent {
  id: string;
  order_id: string;
  store_id: string;
  platform: ConversionPlatform;
  event_type: string;
  status: ConversionStatus;
  payload: Record<string, unknown>;
  platform_event_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
