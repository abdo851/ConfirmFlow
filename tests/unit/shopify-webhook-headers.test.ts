import { describe, expect, it } from "vitest";
import { parseShopifyWebhookHeaders } from "@/lib/integrations/shopify/webhooks/headers";

describe("Shopify webhook headers", () => {
  const validHeaders = {
    "X-Shopify-Hmac-SHA256": "abc123",
    "X-Shopify-Shop-Domain": "demo.myshopify.com",
    "X-Shopify-Topic": "orders/create",
    "X-Shopify-Webhook-Id": "wh_123",
  };

  it("parses required Shopify headers case-insensitively", () => {
    const result = parseShopifyWebhookHeaders(validHeaders);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.headers.shopDomain).toBe("demo.myshopify.com");
      expect(result.headers.topic).toBe("orders/create");
      expect(result.headers.webhookId).toBe("wh_123");
    }
  });

  it("rejects missing HMAC header", () => {
    const result = parseShopifyWebhookHeaders({
      ...validHeaders,
      "X-Shopify-Hmac-SHA256": "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_hmac");
    }
  });

  it("rejects missing shop domain header", () => {
    const result = parseShopifyWebhookHeaders({
      "X-Shopify-Hmac-SHA256": "abc123",
      "X-Shopify-Topic": "orders/create",
      "X-Shopify-Webhook-Id": "wh_123",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_shop_domain");
    }
  });

  it("rejects missing webhook ID header", () => {
    const result = parseShopifyWebhookHeaders({
      "X-Shopify-Hmac-SHA256": "abc123",
      "X-Shopify-Shop-Domain": "demo.myshopify.com",
      "X-Shopify-Topic": "orders/create",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_webhook_id");
    }
  });
});
