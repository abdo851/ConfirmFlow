import { describe, expect, it } from "vitest";
import { parseYouCanWebhookHeaders } from "@/lib/integrations/youcan/webhooks/headers";

describe("YouCan webhook headers", () => {
  it("parses required delivery headers", () => {
    const result = parseYouCanWebhookHeaders({
      "X-YOUCAN-SIGNATURE": "abc123",
      "X-YOUCAN-TOPIC": "order.created",
      "X-YOUCAN-DELIVERY-ID": "delivery-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.headers.deliveryId).toBe("delivery-1");
      expect(result.headers.topic).toBe("order.created");
    }
  });

  it("rejects missing delivery id", () => {
    const result = parseYouCanWebhookHeaders({
      "X-YOUCAN-SIGNATURE": "abc123",
      "X-YOUCAN-TOPIC": "order.created",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_delivery_id");
    }
  });
});
