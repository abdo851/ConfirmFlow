import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { ORDERS_PAGE_SIZE } from "./list-query";
import type {
  MerchantOrderListItem,
  OrderConfirmationStatus,
  OrderProvider,
} from "./types";

const ORDER_LIST_COLUMNS =
  "id, owner_id, provider, order_number, external_order_id, customer_email, customer_phone, currency, total_amount_minor, confirmation_status, confirmed_at, received_at";

const EXPORT_BATCH = 500;
const EXPORT_CAP = 10000;

export interface OrdersListRequest {
  provider?: OrderProvider | null;
  status?: OrderConfirmationStatus | null;
  from?: string | null;
  to?: string | null;
  productName?: string | null;
  productSku?: string | null;
  page?: number;
  /** Export path: every order for the session user, still owner-scoped. */
  all?: boolean;
}

export interface OrdersListResult {
  orders: MerchantOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderListRow {
  id: string;
  owner_id: string;
  provider: string | null;
  order_number: string | null;
  external_order_id: string;
  customer_email: string | null;
  customer_phone: string | null;
  currency: string;
  total_amount_minor: number;
  confirmation_status: OrderConfirmationStatus;
  confirmed_at: string | null;
  received_at: string;
}

interface OrdersFilter {
  eq: (column: string, value: string) => OrdersFilter;
  gte: (column: string, value: string) => OrdersFilter;
  lte: (column: string, value: string) => OrdersFilter;
  contains: (column: string, value: unknown) => OrdersFilter;
  order: (column: string, options: { ascending: boolean }) => OrdersFilter;
  range: (
    from: number,
    to: number,
  ) => Promise<{
    data: OrderListRow[] | null;
    error: { message: string } | null;
    count: number | null;
  }>;
}

interface OrdersDb {
  from: (table: "orders") => {
    select: (columns: string, options?: { count?: "exact" }) => OrdersFilter;
  };
}

function asProvider(value: string | null): OrderProvider | null {
  if (value === "shopify" || value === "youcan" || value === "woocommerce") {
    return value;
  }
  return null;
}

function mapRow(row: OrderListRow): MerchantOrderListItem {
  return {
    id: row.id,
    orderNumber: row.order_number,
    externalOrderId: row.external_order_id,
    provider: asProvider(row.provider),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    currency: row.currency,
    totalAmountMinor: row.total_amount_minor,
    confirmationStatus: row.confirmation_status,
    confirmedAt: row.confirmed_at,
    receivedAt: row.received_at,
  };
}

function keepOwned(rows: OrderListRow[], userId: string): OrderListRow[] {
  const safe = rows.filter((row) => row.owner_id === userId);
  const dropped = rows.length - safe.length;
  if (dropped > 0) {
    console.warn("orders_list_dropped_foreign_rows", { dropped });
  }
  return safe;
}

function scopedQuery(db: OrdersDb, userId: string, request: OrdersListRequest): OrdersFilter {
  let query = db.from("orders").select(ORDER_LIST_COLUMNS, { count: "exact" }).eq("owner_id", userId);

  if (request.provider) {
    query = query.eq("provider", request.provider);
  }
  if (request.status) {
    query = query.eq("confirmation_status", request.status);
  }
  if (request.from) {
    query = query.gte("received_at", request.from);
  }
  if (request.to) {
    query = query.lte("received_at", request.to);
  }
  if (request.productName) {
    const match: { name: string; sku?: string } = { name: request.productName };
    if (request.productSku) {
      match.sku = request.productSku;
    }
    query = query.contains("line_items", [match]);
  }

  return query.order("received_at", { ascending: false });
}

export async function getOrdersForAuthenticatedUser(
  request: OrdersListRequest = {},
): Promise<OrdersListResult | null> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return null;
  }

  const db = (await createUserDatabaseClient()) as unknown as OrdersDb;

  if (request.all) {
    const orders: MerchantOrderListItem[] = [];
    let offset = 0;

    while (offset < EXPORT_CAP) {
      const { data, error } = await scopedQuery(db, user.id, request).range(offset, offset + EXPORT_BATCH - 1);
      if (error) {
        throw new Error("Unable to load orders.");
      }
      const batch = data ?? [];
      orders.push(...keepOwned(batch, user.id).map(mapRow));
      if (batch.length < EXPORT_BATCH) {
        break;
      }
      offset += EXPORT_BATCH;
    }

    return {
      orders,
      total: orders.length,
      page: 1,
      pageSize: orders.length || ORDERS_PAGE_SIZE,
    };
  }

  const page = request.page && request.page > 0 ? Math.floor(request.page) : 1;
  const start = (page - 1) * ORDERS_PAGE_SIZE;
  const { data, error, count } = await scopedQuery(db, user.id, request).range(
    start,
    start + ORDERS_PAGE_SIZE - 1,
  );

  if (error) {
    throw new Error("Unable to load orders.");
  }

  const rows = data ?? [];
  const safe = keepOwned(rows, user.id);
  const dropped = rows.length - safe.length;
  const total = Math.max(0, (count ?? safe.length) - dropped);

  return {
    orders: safe.map(mapRow),
    total,
    page,
    pageSize: ORDERS_PAGE_SIZE,
  };
}
