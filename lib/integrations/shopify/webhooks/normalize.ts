import type { NormalizedWebhookEvent } from "@/lib/webhooks/ingestion";
import type { ShopifyWebhookHeaders } from "./headers";
import { SHOPIFY_WEBHOOK_PROVIDER } from "./constants";
import type { ResolvedShopifyStore } from "./resolve-store";
import { hashWebhookPayload } from "./payload-hash";

export function normalizeShopifyWebhookEvent(input: {
  headers: ShopifyWebhookHeaders;
  rawBody: string;
  store: ResolvedShopifyStore;
  receivedAt?: Date;
}): NormalizedWebhookEvent {
  return {
    provider: SHOPIFY_WEBHOOK_PROVIDER,
    externalEventId: input.headers.webhookId,
    topic: input.headers.topic,
    shopDomain: input.store.shopDomain,
    storeId: input.store.storeId,
    ownerId: input.store.ownerId,
    payloadHash: hashWebhookPayload(input.rawBody),
    receivedAt: input.receivedAt ?? new Date(),
  };
}
