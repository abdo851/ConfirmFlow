/** Credentials for one COD Network seller connection. */
export interface CodeNetworkSellerConnectionConfig {
  apiToken: string;
  webhookSecret: string;
  baseUrl?: string;
}

/** Body for POST /v2/seller/orders. */
export interface CodeNetworkSellerCreateOrderInput {
  full_name: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  area: string;
  pay_mode?: "cod" | "pre_paid";
  items: Array<{ sku: string; quantity: number; price: number }>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/** Order object returned by the seller API. */
export interface CodeNetworkSellerOrder {
  id: number;
  reference: string | null;
  lead_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_city: string | null;
  customer_area: string | null;
  customer_address: string | null;
  customer_country_name: string | null;
  status: number | null;
  status_name: string | null;
  sku: string | null;
  quantity: string | null;
  total: number | null;
  currency: number | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Successful seller API envelope. */
export interface CodeNetworkSellerApiSuccess<T> {
  status: "success";
  data: T;
  meta?: Record<string, unknown>;
}

/** Failed seller API envelope. */
export interface CodeNetworkSellerApiError {
  status: "error";
  message: string;
  code?: string;
}

/** Seller API response, distinguished by status. */
export type CodeNetworkSellerApiResult<T> = CodeNetworkSellerApiSuccess<T> | CodeNetworkSellerApiError;

/** Inbound seller webhook body. Unknown keys are kept. */
export interface CodeNetworkSellerWebhookPayload {
  lead_id?: string | number;
  status?: string;
  subid?: string;
  subid2?: string;
  [key: string]: unknown;
}

/** Inbound seller webhook event names. */
export type CodeNetworkSellerWebhookEventType = "lead_status" | "order_status";
