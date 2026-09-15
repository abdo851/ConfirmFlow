export type WebhookSource =
  | "store"
  | "confirmation"
  | "marketing"
  | "internal";

export interface WebhookEvent {
  id: string;
  source: WebhookSource;
  eventType: string;
  payload: unknown;
  receivedAt: Date;
  idempotencyKey: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  eventId: string;
  error?: string;
}
