import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";
import {
  createOAuthState,
  handleShopifyOAuthCallback,
  parseOAuthState,
  verifyShopifyCallbackHmac,
  validateCallbackParameters,
  exchangeShopifyAccessToken,
} from "@/lib/integrations/shopify/oauth";

const TEST_SECRET = "test-session-secret-with-minimum-length-123456";

describe("Shopify OAuth foundation", () => {
  it("generates and validates OAuth state", () => {
    const { state } = createOAuthState("demo.myshopify.com", TEST_SECRET);
    const parsed = parseOAuthState(state, TEST_SECRET, 60_000);

    expect(parsed?.shop).toBe("demo.myshopify.com");
    expect(parsed?.nonce).toBeTruthy();
  });

  it("rejects expired OAuth state", () => {
    const { state } = createOAuthState("demo.myshopify.com", TEST_SECRET);
    expect(parseOAuthState(state, TEST_SECRET, 60_000)).not.toBeNull();
    expect(parseOAuthState(state, TEST_SECRET, -1)).toBeNull();
  });

  it("validates callback parameters", () => {
    expect(
      validateCallbackParameters({
        code: "abc",
        shop: "demo.myshopify.com",
        state: "state",
        hmac: "hmac",
      }).valid,
    ).toBe(true);

    expect(
      validateCallbackParameters({
        shop: "demo.myshopify.com",
        state: "state",
        hmac: "hmac",
      }).valid,
    ).toBe(false);
  });

  it("verifies Shopify callback HMAC", () => {
    const params = {
      code: "abc123",
      shop: "demo.myshopify.com",
      state: "nonce",
      timestamp: "1700000000",
    };

    const message = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const hmac = createHmac("sha256", "shopify-secret").update(message).digest("hex");

    expect(
      verifyShopifyCallbackHmac({ ...params, hmac }, "shopify-secret"),
    ).toBe(true);
    expect(
      verifyShopifyCallbackHmac({ ...params, hmac: "invalid" }, "shopify-secret"),
    ).toBe(false);
  });

  it("handles successful callback with mocked token exchange", async () => {
    const { state, payload } = createOAuthState("demo.myshopify.com", TEST_SECRET);
    const params = {
      code: "auth-code",
      shop: "demo.myshopify.com",
      state,
      timestamp: "1700000000",
    };

    const message = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const hmac = createHmac("sha256", "shopify-secret").update(message).digest("hex");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "shpat_test_token",
        scope: "read_products",
      }),
    });

    const result = await handleShopifyOAuthCallback(
      {
        query: { ...params, hmac },
        expectedState: payload,
        clientId: "client-id",
        clientSecret: "shopify-secret",
      },
      fetchMock,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.shop).toBe("demo.myshopify.com");
      expect(result.accessToken).toBe("shpat_test_token");
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns failure for invalid callback state", async () => {
    const result = await handleShopifyOAuthCallback(
      {
        query: {
          code: "auth-code",
          shop: "demo.myshopify.com",
          state: "state",
          hmac: "invalid",
        },
        expectedState: {
          nonce: "state",
          shop: "other.myshopify.com",
          issuedAt: Date.now(),
        },
        clientId: "client-id",
        clientSecret: "shopify-secret",
      },
      vi.fn(),
    );

    expect(result.ok).toBe(false);
  });

  it("does not expose token details when token exchange fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });

    const result = await exchangeShopifyAccessToken(
      {
        shop: "demo.myshopify.com",
        code: "bad-code",
        clientId: "client-id",
        clientSecret: "shopify-secret",
      },
      fetchMock,
    );

    expect(result.success).toBe(false);
    expect(result.accessToken).toBeUndefined();
  });
});
