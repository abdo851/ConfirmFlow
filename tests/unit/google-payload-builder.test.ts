import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { buildGooglePayload } from "@/lib/integrations/google/capi/payload-builder";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("Google payload builder", () => {
  it("builds an enhanced conversion with hashed identifiers", () => {
    const payload = buildGooglePayload({
      conversion_id: "AW-1234567890",
      conversion_label: "purchase_label",
      event_id: "google:purchase:order-1",
      confirmed_at: "2026-09-25T12:00:00.000Z",
      order: {
        id: "order-1",
        currency: "mad",
        value: 230,
        email: "Merchant@Example.com",
        phone: "+212600000000",
      },
    });

    expect(payload.partialFailure).toBe(true);
    expect(payload.conversions).toHaveLength(1);
    expect(payload.conversions[0]?.conversionAction).toBe(
      "customers/1234567890/conversionActions/purchase_label",
    );
    expect(payload.conversions[0]?.conversionDateTime).toBe("2026-09-25 12:00:00+00:00");
    expect(payload.conversions[0]?.conversionValue).toBe(230);
    expect(payload.conversions[0]?.currencyCode).toBe("MAD");
    expect(payload.conversions[0]?.orderId).toBe("google:purchase:order-1");
    expect(payload.conversions[0]?.userIdentifiers).toEqual([
      { hashedEmail: sha256("merchant@example.com") },
      { hashedPhoneNumber: sha256("212600000000") },
    ]);
  });
});
