import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedWooCommerceOrder } from "./normalize";

export type PersistWooCommerceOrderOutcome =
  | { outcome: "created"; orderId: string }
  | { outcome: "updated"; orderId: string };

export async function persistWooCommerceOrder(
  input: {
    store_id: string;
    owner_id: string;
    normalized_order: NormalizedWooCommerceOrder;
    receivedAt?: Date;
  },
  db: SupabaseClient,
): Promise<PersistWooCommerceOrderOutcome> {
  const order = input.normalized_order;
  const { data: existing, error: existingError } = await db
    .from("orders")
    .select("id")
    .eq("store_id", input.store_id)
    .eq("provider", "woocommerce")
    .eq("external_order_id", order.externalOrderId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to verify WooCommerce order idempotency.");
  }

  const fields = {
    order_number: order.orderNumber,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    currency: order.currency,
    subtotal_amount_minor: order.subtotalAmountMinor,
    total_amount_minor: order.totalAmountMinor,
    financial_status: order.financialStatus,
    provider_created_at: order.providerCreatedAt?.toISOString() ?? null,
  };

  if (existing) {
    const { error: updateError } = await db
      .from("orders")
      .update(fields)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error("Unable to update WooCommerce order.");
    }

    return { outcome: "updated", orderId: existing.id };
  }

  const { data: inserted, error: insertError } = await db
    .from("orders")
    .insert({
      store_id: input.store_id,
      owner_id: input.owner_id,
      provider: "woocommerce",
      external_order_id: order.externalOrderId,
      confirmation_status: "pending",
      received_at: (input.receivedAt ?? new Date()).toISOString(),
      ...fields,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error("Unable to persist WooCommerce order.");
  }

  return { outcome: "created", orderId: inserted.id };
}
