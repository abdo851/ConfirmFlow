import { describe, expect, it } from "vitest";
import { InternalEventType } from "@/lib/events";
import { processWebhook } from "@/lib/webhooks";
import type {
  IdempotencyStore,
  WebhookHandler,
  WebhookVerifier,
} from "@/lib/webhooks";
import type { WebhookEvent } from "@/lib/webhooks";

describe("M0 foundation", () => {
  it("defines internal event types", () => {
    expect(InternalEventType.ORDER_CREATED).toBe("ORDER_CREATED");
    expect(InternalEventType.CONVERSION_SENT).toBe("CONVERSION_SENT");
  });

  it("processes webhooks through the generic pipeline", async () => {
    const event: WebhookEvent = {
      id: "evt_1",
      source: "internal",
      eventType: "TEST_EVENT",
      payload: {},
      receivedAt: new Date(),
      idempotencyKey: "key_1",
    };

    const verifier: WebhookVerifier = {
      verify: async () => ({ valid: true }),
    };

    const idempotencyStore: IdempotencyStore = {
      hasProcessed: async () => false,
      markProcessed: async () => {},
    };

    const handler: WebhookHandler = {
      canHandle: (type) => type === "TEST_EVENT",
      handle: async () => {},
    };

    const result = await processWebhook(
      event,
      verifier,
      idempotencyStore,
      [handler],
      {},
      "{}",
    );

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("evt_1");
  });
});
