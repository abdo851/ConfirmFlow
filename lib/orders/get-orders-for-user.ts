import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import type {
  MerchantOrderListItem,
  OrderConfirmationStatus,
} from "./types";

export async function getOrdersForAuthenticatedUser(): Promise<{
  orders: MerchantOrderListItem[];
} | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, order_number, external_order_id, customer_email, customer_phone, currency, total_amount_minor, confirmation_status, confirmed_at, received_at",
    )
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load orders.");
  }

  const orders = (data ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    externalOrderId: row.external_order_id,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    currency: row.currency,
    totalAmountMinor: row.total_amount_minor,
    confirmationStatus: row.confirmation_status as OrderConfirmationStatus,
    confirmedAt: row.confirmed_at,
    receivedAt: row.received_at,
  }));

  return { orders };
}
