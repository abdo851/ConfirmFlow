import { describe, expect, it } from "vitest";
import { mapStoredWebhooks, mapWebhookStatus, topicForWebhookIndex } from "@/lib/dashboard/get-webhooks-for-user";

describe("webhook list mapping", () => {
  it("pairs stored ids with order topics and the latest matching delivery", () => {
    const rows = mapStoredWebhooks({
      connectionId: "conn-1",
      storeUrl: "https://shop.example",
      webhookIds: ["11", "22"],
      deliveryUrl: "https://app.example/hook",
      events: [
        { topic: "order.updated", status: "accepted", receivedAt: "2026-09-23T10:00:00.000Z" },
        { topic: "order.created", status: "rejected", receivedAt: "2026-09-23T09:00:00.000Z" },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      webhook_id: "11",
      topic: "order.created",
      last_delivery_status: "rejected",
      provider: "woocommerce",
    });
    expect(rows[1]?.topic).toBe(topicForWebhookIndex(1));
    expect(mapWebhookStatus("paused")).toBe("paused");
    expect(mapWebhookStatus("nope")).toBe("unknown");
  });
});
