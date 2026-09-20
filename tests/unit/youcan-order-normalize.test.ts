import { describe, expect, it } from "vitest";
import { normalizeYouCanOrder } from "@/lib/integrations/youcan/orders/normalize";
import { buildYouCanOrderBody } from "../fixtures/youcan-order";
import { parseYouCanOrderPayload } from "@/lib/integrations/youcan/orders";

describe("YouCan order normalization", () => {
  it("maps order.created payload into pending Confirma order input", () => {
    const parsed = parseYouCanOrderPayload(buildYouCanOrderBody());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const normalized = normalizeYouCanOrder(parsed.payload, {
      storeId: "store-confirma-id",
      ownerId: "owner-id",
      receivedAt: new Date("2026-08-08T21:30:00.000Z"),
    });

    expect(normalized.provider).toBe("youcan");
    expect(normalized.externalOrderId).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(normalized.confirmationStatus).toBe("pending");
    expect(normalized.currency).toBe("MAD");
    expect(normalized.totalAmountMinor).toBe(24990);
    expect(normalized.customerEmail).toBe("buyer@example.com");
  });
});
