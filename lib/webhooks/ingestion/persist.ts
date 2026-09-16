import type { SupabaseClient } from "@supabase/supabase-js";
import type { WebhookIngestionStatus, WebhookProvider } from "./types";

export interface PersistWebhookEventInput {
  storeId: string;
  provider: WebhookProvider;
  externalEventId: string;
  topic: string;
  shopDomain: string;
  status: WebhookIngestionStatus;
  payloadHash: string;
  receivedAt?: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export type PersistWebhookEventOutcome =
  | { outcome: "created"; eventId: string }
  | { outcome: "duplicate"; eventId: string };

export async function persistWebhookEvent(
  db: SupabaseClient,
  input: PersistWebhookEventInput,
): Promise<PersistWebhookEventOutcome> {
  const receivedAt = (input.receivedAt ?? new Date()).toISOString();
  const processedAt = input.processedAt?.toISOString() ?? receivedAt;

  const { data: existing, error: existingError } = await db
    .from("store_webhook_events")
    .select("id")
    .eq("store_id", input.storeId)
    .eq("provider", input.provider)
    .eq("external_event_id", input.externalEventId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to verify webhook idempotency.");
  }

  if (existing) {
    return { outcome: "duplicate", eventId: existing.id };
  }

  const { data: inserted, error: insertError } = await db
    .from("store_webhook_events")
    .insert({
      store_id: input.storeId,
      provider: input.provider,
      external_event_id: input.externalEventId,
      topic: input.topic,
      shop_domain: input.shopDomain,
      status: input.status,
      payload_hash: input.payloadHash,
      received_at: receivedAt,
      processed_at: processedAt,
      error_message: input.errorMessage ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: duplicate } = await db
        .from("store_webhook_events")
        .select("id")
        .eq("store_id", input.storeId)
        .eq("provider", input.provider)
        .eq("external_event_id", input.externalEventId)
        .maybeSingle();

      if (duplicate) {
        return { outcome: "duplicate", eventId: duplicate.id };
      }
    }

    throw new Error("Unable to persist webhook event.");
  }

  return { outcome: "created", eventId: inserted.id };
}
