import { describe, expect, it } from "vitest";
import { normalizeYouCanOrder } from "@/lib/integrations/youcan/orders/normalize";
import type { YouCanOrderWebhookPayload } from "@/lib/integrations/youcan/orders/schema";

const context = {
  storeId: "store-1",
  ownerId: "owner-1",
  receivedAt: new Date("2026-10-04T00:00:00.000Z"),
};

function payload(partial: Partial<YouCanOrderWebhookPayload>): YouCanOrderWebhookPayload {
  return {
    id: "order-1",
    total: 10,
    currency: "MAD",
    ...partial,
  };
}

describe("YouCan customer mapping", () => {
  it("maps customer fields from custom_fields", () => {
    const normalized = normalizeYouCanOrder(
      payload({
        custom_fields: {
          customerName: "Abderrim A",
          customerPhone: "2222416693",
          customerAddress: "sect nahda",
          customerCity: "Rabat",
        },
      }),
      context,
    );

    expect(normalized.customerName).toBe("Abderrim A");
    expect(normalized.customerPhone).toBe("2222416693");
    expect(normalized.city).toBe("Rabat");
    expect(normalized.addressLine).toBe("sect nahda");
  });

  it("maps customer fields from extra_fields", () => {
    const normalized = normalizeYouCanOrder(
      payload({
        extra_fields: {
          name: "X",
          phone: "Y",
          address: "Z",
          "المدينة": "الرباط",
        },
      }),
      context,
    );

    expect(normalized.customerName).toBe("X");
    expect(normalized.customerPhone).toBe("Y");
    expect(normalized.addressLine).toBe("Z");
    expect(normalized.city).toBe("الرباط");
  });

  it("returns null customer fields when both sources are missing", () => {
    const normalized = normalizeYouCanOrder(payload({}), context);

    expect(normalized.customerName).toBeNull();
    expect(normalized.customerPhone).toBeNull();
    expect(normalized.city).toBeNull();
    expect(normalized.addressLine).toBeNull();
  });
});
