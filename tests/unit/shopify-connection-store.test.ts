import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHOPIFY_CONNECTION_COOKIE } from "@/lib/integrations/shopify/oauth";

const mockDelete = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/integrations/shopify/persistence", () => ({
  disconnectShopifyConnectionForUser: vi.fn(),
  getShopifyAccessTokenForUser: vi.fn(),
  getShopifyConnectionStateForUser: vi.fn(),
}));

describe("Shopify connection store cookie boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(undefined);
  });

  it("does not mutate cookies when reading public connection state", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { getShopifyConnectionStateForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );
    const { getShopifyConnectionPublicState } = await import(
      "@/lib/integrations/shopify/session"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getShopifyConnectionStateForUser).mockResolvedValue({
      provider: "shopify",
      status: "connected",
      shop: "demo.myshopify.com",
    });

    const state = await getShopifyConnectionPublicState();

    expect(state.status).toBe("connected");
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not mutate cookies when reading access token", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { getShopifyAccessTokenForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );
    const { getShopifyAccessToken } = await import(
      "@/lib/integrations/shopify/session"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getShopifyAccessTokenForUser).mockResolvedValue("secret-token");

    const token = await getShopifyAccessToken();

    expect(token).toBe("secret-token");
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("clears the legacy connection cookie from mutation boundaries", async () => {
    const { clearLegacyShopifyConnectionCookie } = await import(
      "@/lib/integrations/shopify/session"
    );

    await clearLegacyShopifyConnectionCookie();

    expect(mockDelete).toHaveBeenCalledWith(SHOPIFY_CONNECTION_COOKIE);
  });

  it("clears the legacy connection cookie when disconnecting", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { disconnectShopifyConnectionForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );
    const { clearShopifyConnection } = await import(
      "@/lib/integrations/shopify/session"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(disconnectShopifyConnectionForUser).mockResolvedValue(undefined);

    await clearShopifyConnection();

    expect(disconnectShopifyConnectionForUser).toHaveBeenCalledWith("user-1");
    expect(mockDelete).toHaveBeenCalledWith(SHOPIFY_CONNECTION_COOKIE);
  });
});
