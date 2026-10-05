import { createDatabaseClient } from "@/lib/database/client";
import { createCodeNetworkSellerClient } from "./client";
import { unsealToken } from "./crypto";
import type { CodeNetworkSellerCreateOrderInput, CodeNetworkSellerOrder } from "./types";

const PROVIDER_ID = "cod_network_seller";

type ForwardStatus = "sent" | "failed" | "skipped" | "duplicate";

type LineItem = { sku?: string | null; quantity?: number | null; price?: number | null };

type OrderRow = {
  id: string;
  ownerId: string;
  customerName: string | null;
  customerPhone: string | null;
  city: string | null;
  addressLine: string | null;
  country: string | null;
  area: string | null;
  total: number | null;
  lineItems: LineItem[];
};

type QueryResult = { data: Record<string, unknown> | null; error: { message?: string } | null };

type Query = {
  select: (columns: string) => Query;
  eq: (column: string, value: string) => Query;
  maybeSingle: () => Promise<QueryResult>;
  insert: (row: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
};

type Db = { from: (table: string) => Query };

function inferCountryFromPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("966")) return "SA";
  if (digits.startsWith("971")) return "AE";
  if (digits.startsWith("965")) return "KW";
  if (digits.startsWith("974")) return "QA";
  if (digits.startsWith("973")) return "BH";
  if (digits.startsWith("968")) return "OM";
  if (digits.startsWith("212")) return "MA";
  if (digits.startsWith("20")) return "EG";
  return "MA";
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is LineItem => Boolean(item) && typeof item === "object");
}

function readOrder(row: Record<string, unknown>): OrderRow {
  const total = typeof row.total === "number" ? row.total : typeof row.total_amount_minor === "number" ? row.total_amount_minor : null;
  return {
    id: text(row.id) ?? "",
    ownerId: text(row.owner_id) ?? "",
    customerName: text(row.customer_name),
    customerPhone: text(row.customer_phone),
    city: text(row.city),
    addressLine: text(row.address_line),
    country: text(row.country),
    area: text(row.area),
    total,
    lineItems: readItems(row.line_items),
  };
}

async function readOne(db: Db, table: string, columns: string, filters: Record<string, string>): Promise<Record<string, unknown> | null> {
  let query = db.from(table).select(columns);
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}

async function writeLog(db: Db, row: Record<string, unknown>): Promise<void> {
  try {
    await db.from("order_forwarding_log").insert(row);
  } catch {
    return;
  }
}

function summary(order: OrderRow, country: string, usedDefaultCountry: boolean) {
  return {
    has_name: Boolean(order.customerName?.trim()),
    has_phone: Boolean(order.customerPhone?.trim()),
    has_city: Boolean(order.city?.trim()),
    has_address: Boolean(order.addressLine?.trim()),
    country,
    items_count: order.lineItems.length,
    used_default_country: usedDefaultCountry,
  };
}

export async function forwardOrderToCodeNetworkSeller(input: {
  ownerId: string;
  orderId: string;
}): Promise<{ status: ForwardStatus }> {
  try {
    const db = createDatabaseClient() as unknown as Db;
    const connection = await readOne(db, "cod_network_connections", "id, status, api_token_encrypted", {
      owner_id: input.ownerId,
    });
    if (!connection || connection.status !== "active") {
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "skipped",
      });
      return { status: "skipped" };
    }

    const sent = await readOne(db, "order_forwarding_log", "id", {
      order_id: input.orderId,
      provider_id: PROVIDER_ID,
      status: "sent",
    });
    if (sent) {
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "duplicate",
      });
      return { status: "duplicate" };
    }

    const orderRow = await readOne(
      db,
      "orders",
      "id, owner_id, customer_name, customer_phone, city, address_line, line_items, total_amount_minor",
      { id: input.orderId, owner_id: input.ownerId },
    );
    if (!orderRow) {
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "skipped",
      });
      return { status: "skipped" };
    }

    const order = readOrder(orderRow);
    const usedDefaultCountry = !order.country?.trim();
    const country = (order.country && order.country.trim()) || inferCountryFromPhone(order.customerPhone);
    const area = (order.area && order.area.trim()) || order.city || "N/A";
    const totalQty = order.lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || 1;
    const unitPrice = order.total && totalQty ? Math.round(order.total / totalQty) : 0;
    const items = order.lineItems.map((item) => ({
      sku: item.sku ?? "",
      quantity: item.quantity ?? 1,
      price: item.price ?? unitPrice,
    }));
    const body: CodeNetworkSellerCreateOrderInput = {
      full_name: order.customerName ?? "",
      phone: order.customerPhone ?? "",
      country,
      address: order.addressLine || order.city || order.area || "N/A",
      city: order.city ?? "",
      area,
      pay_mode: "cod",
      items,
    };
    const payloadSummary = summary(order, country, usedDefaultCountry);

    const missing = missingField(body);
    if (missing) {
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "failed",
        error_message: `missing_required_fields:${missing}`,
        payload_summary: payloadSummary,
      });
      return { status: "failed" };
    }

    let apiToken: string;
    try {
      apiToken = unsealToken(text(connection.api_token_encrypted) ?? "");
    } catch {
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "failed",
        error_message: "invalid_ciphertext",
        payload_summary: payloadSummary,
      });
      return { status: "failed" };
    }

    try {
      const response = await createCodeNetworkSellerClient({ apiToken }).createOrder(body);
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "sent",
        external_order_id: String(response.id),
        external_reference: response.reference ?? null,
        http_status: 201,
        payload_summary: payloadSummary,
        response_summary: responseSummary(response),
      });
      return { status: "sent" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "cod_network_seller_error";
      if (message.includes("cod_network_seller_duplicate_lead")) {
        await writeLog(db, {
          owner_id: input.ownerId,
          order_id: input.orderId,
          provider_id: PROVIDER_ID,
          status: "duplicate",
          payload_summary: payloadSummary,
        });
        return { status: "duplicate" };
      }
      const err = error as {
        httpStatus?: number;
        responseBody?: unknown;
        responseText?: string;
        message?: string;
      };
      const httpStatus = typeof err.httpStatus === "number" ? err.httpStatus : null;
      const responseSummary =
        err.responseBody ?? (err.responseText ? { raw: err.responseText } : null);
      const detailedMessage = typeof err.message === "string" ? err.message : "unknown_error";
      await writeLog(db, {
        owner_id: input.ownerId,
        order_id: input.orderId,
        provider_id: PROVIDER_ID,
        status: "failed",
        http_status: httpStatus,
        error_message: detailedMessage.slice(0, 500),
        payload_summary: payloadSummary,
        response_summary: responseSummary,
      });
      return { status: "failed" };
    }
  } catch {
    return { status: "failed" };
  }
}

function missingField(body: CodeNetworkSellerCreateOrderInput): string | null {
  if (!body.full_name.trim()) return "full_name";
  if (!body.phone.trim()) return "phone";
  if (body.items.length === 0) return "items";
  if (body.items.some((item) => !item.sku.trim())) return "items.sku";
  return null;
}

function responseSummary(response: CodeNetworkSellerOrder) {
  return {
    id: response.id,
    reference: response.reference ?? null,
    status_name: response.status_name ?? null,
  };
}
