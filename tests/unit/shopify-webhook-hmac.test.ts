import { describe, expect, it } from "vitest";
import {
  signShopifyWebhookBody,
  verifyShopifyWebhookHmac,
} from "@/lib/integrations/shopify/webhooks/hmac";

const TEST_SECRET = "shopify-test-secret";

describe("Shopify webhook HMAC", () => {
  it("verifies a valid Shopify HMAC", () => {
    const body = JSON.stringify({ id: 123, total_price: "10.00" });
    const hmac = signShopifyWebhookBody(body, TEST_SECRET);

    expect(verifyShopifyWebhookHmac(body, hmac, TEST_SECRET)).toBe(true);
  });

  it("rejects an invalid Shopify HMAC", () => {
    const body = JSON.stringify({ id: 123 });
    const hmac = signShopifyWebhookBody(body, TEST_SECRET);

    expect(verifyShopifyWebhookHmac(body, `${hmac}x`, TEST_SECRET)).toBe(false);
    expect(verifyShopifyWebhookHmac(body, hmac, "wrong-secret")).toBe(false);
  });

  it("rejects a modified request body", () => {
    const body = JSON.stringify({ id: 123 });
    const hmac = signShopifyWebhookBody(body, TEST_SECRET);
    const modified = JSON.stringify({ id: 456 });

    expect(verifyShopifyWebhookHmac(modified, hmac, TEST_SECRET)).toBe(false);
  });
});
