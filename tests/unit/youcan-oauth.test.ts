import { describe, expect, it, vi } from "vitest";
import { buildYouCanOAuthCallbackUrl } from "@/lib/config/app-url";
import {
  buildYouCanAuthorizeUrl,
  createOAuthState,
  exchangeYouCanAccessToken,
  handleYouCanOAuthCallback,
  parseOAuthState,
  validateCallbackParameters,
} from "@/lib/integrations/youcan/oauth";

const TEST_SECRET = "test-session-secret-with-minimum-length-123456";

describe("YouCan OAuth foundation", () => {
  it("builds authorize URL with scope[] parameters", () => {
    const url = buildYouCanAuthorizeUrl({
      clientId: "client-id",
      redirectUri: "https://app.example.com/api/integrations/youcan/callback",
      state: "signed-state",
      scopes: ["read-orders", "read-products"],
    });

    expect(url).toContain(
      "https://seller-area.youcan.shop/admin/oauth/authorize",
    );
    expect(url).toContain("client_id=client-id");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fintegrations%2Fyoucan%2Fcallback",
    );
    expect(url).toContain("scope%5B%5D=read-orders");
    expect(url).toContain("scope%5B%5D=read-products");
  });

  it("uses locale-independent callback path", () => {
    expect(buildYouCanOAuthCallbackUrl("https://app.example.com")).toBe(
      "https://app.example.com/api/integrations/youcan/callback",
    );
  });

  it("generates and validates OAuth state", () => {
    const { state } = createOAuthState("my-store", TEST_SECRET);
    const parsed = parseOAuthState(state, TEST_SECRET, 60_000);

    expect(parsed?.storeSlug).toBe("my-store");
    expect(parsed?.nonce).toBeTruthy();
  });

  it("rejects expired OAuth state", () => {
    const { state } = createOAuthState("my-store", TEST_SECRET);
    expect(parseOAuthState(state, TEST_SECRET, 60_000)).not.toBeNull();
    expect(parseOAuthState(state, TEST_SECRET, -1)).toBeNull();
  });

  it("validates callback parameters", () => {
    expect(
      validateCallbackParameters({
        code: "abc",
        state: "state",
      }).valid,
    ).toBe(true);

    expect(
      validateCallbackParameters({
        error: "access_denied",
      }).denied,
    ).toBe(true);
  });

  it("handles successful callback with mocked token exchange", async () => {
    const { state, payload } = createOAuthState("my-store", TEST_SECRET);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "youcan_test_token",
        scope: "read-orders read-products",
      }),
    });

    const result = await handleYouCanOAuthCallback(
      {
        query: {
          code: "auth-code",
          state,
        },
        expectedState: payload,
        clientId: "client-id",
        clientSecret: "youcan-secret",
        redirectUri: "https://app.example.com/api/integrations/youcan/callback",
      },
      fetchMock,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.storeSlug).toBe("my-store");
      expect(result.accessToken).toBe("youcan_test_token");
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not expose token details when token exchange fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });

    const result = await exchangeYouCanAccessToken(
      {
        code: "bad-code",
        clientId: "client-id",
        clientSecret: "youcan-secret",
        redirectUri: "https://app.example.com/api/integrations/youcan/callback",
      },
      fetchMock,
    );

    expect(result.success).toBe(false);
    expect(result.accessToken).toBeUndefined();
  });
});
