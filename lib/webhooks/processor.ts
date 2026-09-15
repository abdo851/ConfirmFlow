import type {
  WebhookEvent,
  WebhookProcessResult,
  WebhookVerificationResult,
} from "./types";

export interface WebhookVerifier {
  verify(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookVerificationResult>;
}

export interface WebhookHandler {
  canHandle(eventType: string): boolean;
  handle(event: WebhookEvent): Promise<void>;
}

export interface IdempotencyStore {
  hasProcessed(key: string): Promise<boolean>;
  markProcessed(key: string, eventId: string): Promise<void>;
}

/**
 * Generic webhook processing pipeline.
 * Provider-specific verification and handlers are registered in future milestones.
 */
export async function processWebhook(
  event: WebhookEvent,
  verifier: WebhookVerifier,
  idempotencyStore: IdempotencyStore,
  handlers: WebhookHandler[],
  headers: Record<string, string>,
  rawBody: string,
): Promise<WebhookProcessResult> {
  const verification = await verifier.verify(headers, rawBody);
  if (!verification.valid) {
    return {
      success: false,
      eventId: event.id,
      error: verification.reason ?? "Webhook verification failed",
    };
  }

  if (await idempotencyStore.hasProcessed(event.idempotencyKey)) {
    return { success: true, eventId: event.id };
  }

  try {
    const handler = handlers.find((h) => h.canHandle(event.eventType));
    if (!handler) {
      return {
        success: false,
        eventId: event.id,
        error: `No handler for event type: ${event.eventType}`,
      };
    }

    await handler.handle(event);
    await idempotencyStore.markProcessed(event.idempotencyKey, event.id);

    return { success: true, eventId: event.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, eventId: event.id, error: message };
  }
}
