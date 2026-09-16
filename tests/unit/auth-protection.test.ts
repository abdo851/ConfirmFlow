import { describe, expect, it } from "vitest";
import {
  isProtectedAppPath,
  isProtectedShopifyApiPath,
} from "@/lib/auth/protection";

describe("Auth route protection", () => {
  it("protects dashboard and onboarding routes", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/dashboard/connections")).toBe(true);
    expect(isProtectedAppPath("/onboarding/store")).toBe(true);
    expect(isProtectedAppPath("/en/dashboard")).toBe(true);
    expect(isProtectedAppPath("/ar/dashboard/connections")).toBe(true);
    expect(isProtectedAppPath("/ar/onboarding/store")).toBe(true);
    expect(isProtectedAppPath("/en/login")).toBe(false);
    expect(isProtectedAppPath("/")).toBe(false);
  });

  it("protects Shopify integration API routes", () => {
    expect(isProtectedShopifyApiPath("/api/integrations/shopify/connect")).toBe(
      true,
    );
    expect(isProtectedShopifyApiPath("/api/integrations/shopify/callback")).toBe(
      true,
    );
    expect(isProtectedShopifyApiPath("/api/integrations/shopify/status")).toBe(
      true,
    );
    expect(isProtectedShopifyApiPath("/api/health")).toBe(false);
  });
});
