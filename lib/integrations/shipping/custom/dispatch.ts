import { createUserDatabaseClient } from "@/lib/database/user-client";
import { openValue, signBody } from "./seal";

export type CustomDispatchSummary = { sent: number; failed: number };

export type CustomDispatchConnection = {
  id: string;
  connectionType: "webhook" | "api";
  webhookUrl: string | null;
  signingSecret: string | null;
  apiBaseUrl: string | null;
  apiKey: string | null;
  apiAuthType: "bearer" | "x-api-key" | "basic" | null;
  createShipmentPath: string | null;
};

export type CustomDispatchOrder = {
  id: string;
  orderNumber: string | null;
  externalOrderId: string | null;
  provider: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  city: string | null;
  addressLine: string | null;
  currency: string | null;
  totalAmountMinor: number | null;
  lineItems: unknown;
};

type DispatchDeps = {
  loadOrder: (orderId: string, ownerId: string) => Promise<CustomDispatchOrder | null>;
  loadConnections: (ownerId: string) => Promise<CustomDispatchConnection[]>;
  fetchImpl: typeof fetch;
};

function orderPayload(order: CustomDispatchOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    externalOrderId: order.externalOrderId,
    provider: order.provider,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      city: order.city,
      address: order.addressLine,
    },
    currency: order.currency,
    totalAmountMinor: order.totalAmountMinor,
    lineItems: order.lineItems,
    confirmed: true,
  };
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function authHeaders(connection: CustomDispatchConnection): Record<string, string> {
  if (!connection.apiKey) {
    return {};
  }
  if (connection.apiAuthType === "bearer") {
    return { authorization: `Bearer ${connection.apiKey}` };
  }
  if (connection.apiAuthType === "basic") {
    return { authorization: `Basic ${Buffer.from(connection.apiKey).toString("base64")}` };
  }
  return { "x-api-key": connection.apiKey };
}

async function postJson(
  url: string,
  body: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body,
      signal: controller.signal,
      redirect: "manual",
    });
    return response.ok;
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchCustomShippingForOrder(
  orderId: string,
  ownerId: string,
  deps?: Partial<DispatchDeps>,
): Promise<CustomDispatchSummary> {
  const loadOrder = deps?.loadOrder ?? loadConfirmedOrder;
  const loadConnections = deps?.loadConnections ?? loadActiveConnections;
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const order = await loadOrder(orderId, ownerId);
  if (!order) {
    return { sent: 0, failed: 0 };
  }

  const connections = await loadConnections(ownerId);
  let sent = 0;
  let failed = 0;
  const body = JSON.stringify(orderPayload(order));

  for (const connection of connections) {
    try {
      const ok = await deliverOne(connection, body, fetchImpl);
      if (ok) {
        sent += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
      console.error("custom_shipping_dispatch_failed", { orderId, connectionId: connection.id });
    }
  }

  return { sent, failed };
}

async function deliverOne(
  connection: CustomDispatchConnection,
  body: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  if (connection.connectionType === "webhook") {
    if (!connection.webhookUrl) {
      return false;
    }
    const headers: Record<string, string> = {};
    if (connection.signingSecret) {
      headers["X-Confirma-Signature"] = signBody(body, connection.signingSecret);
    }
    return postJson(connection.webhookUrl, body, headers, fetchImpl);
  }

  if (!connection.apiBaseUrl || !connection.createShipmentPath) {
    return false;
  }
  const url = joinUrl(connection.apiBaseUrl, connection.createShipmentPath);
  return postJson(url, body, authHeaders(connection), fetchImpl);
}

async function loadConfirmedOrder(orderId: string, ownerId: string): Promise<CustomDispatchOrder | null> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, owner_id, confirmation_status, order_number, external_order_id, provider, customer_name, customer_phone, customer_email, city, address_line, currency, total_amount_minor, line_items",
    )
    .eq("id", orderId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data || data.confirmation_status !== "confirmed" || data.owner_id !== ownerId) {
    return null;
  }
  return {
    id: String(data.id),
    orderNumber: data.order_number ?? null,
    externalOrderId: data.external_order_id ?? null,
    provider: data.provider ?? null,
    customerName: data.customer_name ?? null,
    customerPhone: data.customer_phone ?? null,
    customerEmail: data.customer_email ?? null,
    city: data.city ?? null,
    addressLine: data.address_line ?? null,
    currency: data.currency ?? null,
    totalAmountMinor: data.total_amount_minor ?? null,
    lineItems: data.line_items ?? null,
  };
}

async function loadActiveConnections(ownerId: string): Promise<CustomDispatchConnection[]> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("custom_shipping_connections")
    .select(
      "id, owner_id, connection_type, status, webhook_url, hmac_secret_encrypted, api_base_url, api_key_encrypted, api_auth_type, create_shipment_path",
    )
    .eq("owner_id", ownerId)
    .eq("status", "active");
  if (error || !data) {
    return [];
  }
  return data
    .filter((row) => row.owner_id === ownerId && row.status === "active")
    .map((row) => ({
      id: String(row.id),
      connectionType: row.connection_type === "api" ? "api" : "webhook",
      webhookUrl: row.webhook_url ?? null,
      signingSecret: openPacked(row.hmac_secret_encrypted),
      apiBaseUrl: row.api_base_url ?? null,
      apiKey: openPacked(row.api_key_encrypted),
      apiAuthType: row.api_auth_type ?? null,
      createShipmentPath: row.create_shipment_path ?? null,
    }));
}

function openPacked(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return openValue(value);
  } catch {
    return null;
  }
}
