import { describe, expect, it } from "vitest";
import { validateWaitlistEntry } from "@/lib/waitlist/validate";

describe("waitlist", () => {
  it("accepts YouCan and Shopify emails", () => {
    expect(
      validateWaitlistEntry({ provider: "YouCan", email: "Merchant@Example.com" }),
    ).toEqual({
      ok: true,
      entry: { provider: "youcan", email: "merchant@example.com" },
    });
    expect(validateWaitlistEntry({ provider: "shopify", email: "a@b.co" }).ok).toBe(
      true,
    );
  });

  it("rejects WooCommerce and invalid emails", () => {
    expect(validateWaitlistEntry({ provider: "woocommerce", email: "a@b.co" })).toEqual({
      ok: false,
      error: "invalid_provider",
    });
    expect(validateWaitlistEntry({ provider: "shopify", email: "not-an-email" })).toEqual({
      ok: false,
      error: "invalid_email",
    });
  });
});
