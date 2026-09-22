import { describe, expect, it } from "vitest";
import {
  signWooCommerceWebhookBody,
  verifyWooCommerceSignature,
} from "@/lib/integrations/woocommerce/webhooks/hmac";

const TEST_SECRET = "woocommerce-webhook-secret";

describe("WooCommerce webhook HMAC", () => {
  it("verifies a valid base64 HMAC-SHA256 signature", () => {
    const body = JSON.stringify({ id: 120, total: "10.00" });
    const signature = signWooCommerceWebhookBody(body, TEST_SECRET);

    expect(verifyWooCommerceSignature(body, signature, TEST_SECRET)).toBe(true);
  });

  it("rejects an invalid signature and the wrong secret", () => {
    const body = JSON.stringify({ id: 120 });
    const signature = signWooCommerceWebhookBody(body, TEST_SECRET);

    expect(verifyWooCommerceSignature(body, `${signature}x`, TEST_SECRET)).toBe(
      false,
    );
    expect(verifyWooCommerceSignature(body, signature, "wrong-secret")).toBe(
      false,
    );
  });

  it("rejects a modified request body", () => {
    const body = JSON.stringify({ id: 120 });
    const signature = signWooCommerceWebhookBody(body, TEST_SECRET);

    expect(
      verifyWooCommerceSignature(
        JSON.stringify({ id: 121 }),
        signature,
        TEST_SECRET,
      ),
    ).toBe(false);
  });
});
