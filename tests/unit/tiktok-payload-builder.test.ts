import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { buildTikTokPayload } from "@/lib/integrations/tiktok/capi/payload-builder";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("TikTok payload builder", () => {
  it("builds a CompletePayment event with hashed identifiers", () => {
    const payload = buildTikTokPayload({
      pixel_code: "PIXEL12345",
      event_id: "tiktok:purchase:order-1",
      confirmed_at: "2026-09-25T12:00:00.000Z",
      order: {
        currency: "usd",
        value: 23,
        email: "Merchant@Example.com",
        phone: "+212600000000",
      },
    });

    expect(payload.event_source).toBe("web");
    expect(payload.event_source_id).toBe("PIXEL12345");
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]?.event).toBe("CompletePayment");
    expect(payload.data[0]?.event_time).toBe(
      Math.floor(Date.parse("2026-09-25T12:00:00.000Z") / 1000),
    );
    expect(payload.data[0]?.event_id).toBe("tiktok:purchase:order-1");
    expect(payload.data[0]?.user.email_hashed).toBe(sha256("merchant@example.com"));
    expect(payload.data[0]?.user.phone_hashed).toBe(sha256("212600000000"));
    expect(payload.data[0]?.properties).toEqual({ currency: "USD", value: 23 });
  });

  it("omits hashes when the order has no email or phone", () => {
    const payload = buildTikTokPayload({
      pixel_code: "PIXEL12345",
      event_id: "evt",
      confirmed_at: "2026-09-25T12:00:00.000Z",
      order: { currency: "MAD", value: 100 },
    });

    expect(payload.data[0]?.user).toEqual({});
    expect(JSON.stringify(payload)).not.toContain("@");
  });
});
