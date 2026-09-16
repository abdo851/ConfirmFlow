import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeShopifyOrder,
  parseShopifyOrderPayload,
} from "@/lib/integrations/shopify/orders";
import { persistOrder } from "@/lib/orders";
import type { NormalizedWebhookEvent } from "@/lib/webhooks/ingestion";

export type ProcessShopifyOrderCreateResult =
  | { ok: true; orderId: string; orderOutcome: "created" | "duplicate" }
  | { ok: false; reason: string; httpStatus: number };

export async function processShopifyOrderCreateWebhook(input: {
  rawBody: string;
  normalizedEvent: NormalizedWebhookEvent;
  db: SupabaseClient;
}): Promise<ProcessShopifyOrderCreateResult> {
  const parsed = parseShopifyOrderPayload(input.rawBody);
  if (!parsed.ok) {
    return { ok: false, reason: parsed.reason, httpStatus: 422 };
  }

  let orderInput;
  try {
    orderInput = normalizeShopifyOrder(parsed.payload, {
      storeId: input.normalizedEvent.storeId,
      ownerId: input.normalizedEvent.ownerId,
      receivedAt: input.normalizedEvent.receivedAt,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "order_normalization_failed";
    return { ok: false, reason, httpStatus: 422 };
  }

  try {
    const orderResult = await persistOrder(input.db, orderInput);
    return {
      ok: true,
      orderId: orderResult.orderId,
      orderOutcome: orderResult.outcome,
    };
  } catch {
    return { ok: false, reason: "order_persistence_failed", httpStatus: 500 };
  }
}
