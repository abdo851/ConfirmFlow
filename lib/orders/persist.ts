import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfirmaOrderInput } from "./types";

export type PersistOrderOutcome =
  | { outcome: "created"; orderId: string }
  | { outcome: "duplicate"; orderId: string };

export async function persistOrder(
  db: SupabaseClient,
  order: ConfirmaOrderInput,
): Promise<PersistOrderOutcome> {
  const receivedAt = order.receivedAt.toISOString();

  const { data: existing, error: existingError } = await db
    .from("orders")
    .select("id")
    .eq("store_id", order.storeId)
    .eq("provider", order.provider)
    .eq("external_order_id", order.externalOrderId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to verify order idempotency.");
  }

  if (existing) {
    return { outcome: "duplicate", orderId: existing.id };
  }

  const { data: inserted, error: insertError } = await db
    .from("orders")
    .insert({
      store_id: order.storeId,
      owner_id: order.ownerId,
      provider: order.provider,
      external_order_id: order.externalOrderId,
      order_number: order.orderNumber,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      currency: order.currency.toUpperCase(),
      subtotal_amount_minor: order.subtotalAmountMinor,
      total_amount_minor: order.totalAmountMinor,
      financial_status: order.financialStatus,
      confirmation_status: order.confirmationStatus,
      provider_created_at: order.providerCreatedAt,
      received_at: receivedAt,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: duplicate } = await db
        .from("orders")
        .select("id")
        .eq("store_id", order.storeId)
        .eq("provider", order.provider)
        .eq("external_order_id", order.externalOrderId)
        .maybeSingle();

      if (duplicate) {
        return { outcome: "duplicate", orderId: duplicate.id };
      }
    }

    throw new Error("Unable to persist order.");
  }

  return { outcome: "created", orderId: inserted.id };
}
