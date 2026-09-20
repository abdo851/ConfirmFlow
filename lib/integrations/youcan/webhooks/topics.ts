import type { WebhookIngestionStatus } from "@/lib/webhooks/ingestion";
import {
  YOUCAN_APP_UNINSTALLED_TOPIC,
  YOUCAN_ORDER_CREATED_TOPIC,
  YOUCAN_ORDER_UPDATED_TOPIC,
} from "./constants";

export function classifyYouCanWebhookTopic(topic: string): WebhookIngestionStatus {
  if (topic === YOUCAN_ORDER_CREATED_TOPIC) {
    return "accepted";
  }

  if (
    topic === YOUCAN_ORDER_UPDATED_TOPIC ||
    topic === YOUCAN_APP_UNINSTALLED_TOPIC
  ) {
    return "unsupported";
  }

  return "unsupported";
}
