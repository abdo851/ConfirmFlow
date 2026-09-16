import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";

export interface OrderForPurchaseDelivery {
  id: string;
  store_id: string;
  owner_id: string;
  confirmation_status: "pending" | "confirmed";
  confirmed_at: string | null;
  currency: string;
  total_amount_minor: number;
  customer_email: string | null;
  customer_phone: string | null;
}

export async function loadOrderForPurchaseDelivery(input: {
  orderId: string;
  userId: string;
  db?: SupabaseClient;
}): Promise<
  | { ok: true; order: OrderForPurchaseDelivery }
  | { ok: false; reason: "not_found" | "forbidden" | "not_confirmed" }
> {
  const db = input.db ?? createDatabaseClient();

  const { data, error } = await db
    .from("orders")
    .select(
      "id, store_id, owner_id, confirmation_status, confirmed_at, currency, total_amount_minor, customer_email, customer_phone",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }

  if (data.owner_id !== input.userId) {
    return { ok: false, reason: "forbidden" };
  }

  if (data.confirmation_status !== "confirmed" || !data.confirmed_at) {
    return { ok: false, reason: "not_confirmed" };
  }

  return { ok: true, order: data as OrderForPurchaseDelivery };
}
