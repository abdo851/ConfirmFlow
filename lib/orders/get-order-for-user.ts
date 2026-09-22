import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import type { OrderConfirmationStatus, OrderProvider } from "./types";

export interface MerchantOrderDetail {
  id: string;
  orderNumber: string | null;
  externalOrderId: string;
  provider: OrderProvider;
  customerEmail: string | null;
  customerPhone: string | null;
  currency: string;
  totalAmountMinor: number;
  confirmationStatus: OrderConfirmationStatus;
  confirmedAt: string | null;
  receivedAt: string;
  createdAt: string;
}

export async function getOrderForAuthenticatedUser(
  orderId: string,
): Promise<MerchantOrderDetail | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, order_number, external_order_id, provider, customer_email, customer_phone, currency, total_amount_minor, confirmation_status, confirmed_at, received_at, created_at",
    )
    .eq("id", orderId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load order.");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    orderNumber: data.order_number,
    externalOrderId: data.external_order_id,
    provider: data.provider as OrderProvider,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    currency: data.currency,
    totalAmountMinor: data.total_amount_minor,
    confirmationStatus: data.confirmation_status as OrderConfirmationStatus,
    confirmedAt: data.confirmed_at,
    receivedAt: data.received_at,
    createdAt: data.created_at,
  };
}
