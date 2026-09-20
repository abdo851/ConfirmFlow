import type { NormalizedWebhookEvent } from "@/lib/webhooks/ingestion";
import type { YouCanWebhookHeaders } from "./headers";
import { YOUCAN_WEBHOOK_PROVIDER } from "./constants";
import type { ResolvedYouCanStore } from "./resolve-store";
import { hashWebhookPayload } from "./payload-hash";

export function normalizeYouCanWebhookEvent(input: {
  headers: YouCanWebhookHeaders;
  rawBody: string;
  store: ResolvedYouCanStore;
  receivedAt?: Date;
}): NormalizedWebhookEvent {
  return {
    provider: YOUCAN_WEBHOOK_PROVIDER,
    externalEventId: input.headers.deliveryId,
    topic: input.headers.topic,
    shopDomain: input.store.storeSlug,
    storeId: input.store.storeId,
    ownerId: input.store.ownerId,
    payloadHash: hashWebhookPayload(input.rawBody),
    receivedAt: input.receivedAt ?? new Date(),
  };
}
