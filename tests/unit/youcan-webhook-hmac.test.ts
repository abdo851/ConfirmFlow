import { describe, expect, it } from "vitest";
import {
  signYouCanWebhookBody,
  verifyYouCanWebhookHmac,
} from "@/lib/integrations/youcan/webhooks/hmac";

const TEST_SECRET = "youcan-test-secret";

describe("YouCan webhook HMAC", () => {
  it("verifies valid signatures with constant-time comparison", () => {
    const body = buildYouCanOrderBody();
    const signature = signYouCanWebhookBody(body, TEST_SECRET);

    expect(verifyYouCanWebhookHmac(body, signature, TEST_SECRET)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const body = buildYouCanOrderBody();

    expect(verifyYouCanWebhookHmac(body, "invalid", TEST_SECRET)).toBe(false);
  });
});

function buildYouCanOrderBody() {
  return JSON.stringify({
    event_name: "order.created",
    event_happened_at: "2026-08-08T21:30:00.000000Z",
    data: {
      id: "order-1",
      store_id: "store-1",
      total: 100,
      currency: "MAD",
    },
  });
}
