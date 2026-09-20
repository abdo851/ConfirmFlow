export type WebhookProvider = "shopify" | "youcan";

export type WebhookIngestionStatus =
  | "accepted"
  | "ignored"
  | "unsupported"
  | "duplicate"
  | "rejected";

export interface NormalizedWebhookEvent {
  provider: WebhookProvider;
  externalEventId: string;
  topic: string;
  shopDomain: string;
  storeId: string;
  ownerId: string;
  payloadHash: string;
  receivedAt: Date;
}

export interface WebhookIngestionResult {
  status: WebhookIngestionStatus;
  eventId?: string;
  orderId?: string;
  httpStatus: number;
  message?: string;
}
