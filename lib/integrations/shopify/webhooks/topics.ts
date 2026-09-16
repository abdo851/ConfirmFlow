import type { WebhookIngestionStatus } from "@/lib/webhooks/ingestion";
import { SHOPIFY_ORDER_CREATE_TOPIC } from "./constants";

export function classifyShopifyWebhookTopic(topic: string): WebhookIngestionStatus {
  if (topic === SHOPIFY_ORDER_CREATE_TOPIC) {
    return "accepted";
  }

  return "unsupported";
}
