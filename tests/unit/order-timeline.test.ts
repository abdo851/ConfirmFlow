import { describe, expect, it } from "vitest";
import { buildOrderTimeline, wooAdminOrderUrl } from "@/lib/dashboard/order-timeline";

describe("order timeline", () => {
  it("includes confirmation and a failed Meta delivery when those facts exist", () => {
    const events = buildOrderTimeline({
      receivedAt: "2026-09-23T08:00:00.000Z",
      confirmedAt: "2026-09-23T09:00:00.000Z",
      metaAttemptedAt: "2026-09-23T09:05:00.000Z",
      metaStatus: "failed",
    });

    expect(events.map((event) => event.key)).toEqual(["received", "confirmed", "meta"]);
    expect(events[2]?.status).toBe("failed");
    expect(wooAdminOrderUrl("https://shop.example/", "16")).toBe(
      "https://shop.example/wp-admin/post.php?post=16&action=edit",
    );
  });

  it("stops after received when the order is still pending", () => {
    const events = buildOrderTimeline({
      receivedAt: "2026-09-23T08:00:00.000Z",
      confirmedAt: null,
      metaAttemptedAt: null,
      metaStatus: null,
    });
    expect(events).toEqual([{ key: "received", at: "2026-09-23T08:00:00.000Z" }]);
  });
});
