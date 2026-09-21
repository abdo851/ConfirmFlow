import { describe, expect, it } from "vitest";
import { buildAuthorizeUrl } from "@/lib/integrations/woocommerce/oauth/authorize-url";
import { verifyWooCommerceCallbackPayload } from "@/lib/integrations/woocommerce/oauth/callback-verify";
import { signStoreUrl, verifyState } from "@/lib/integrations/woocommerce/oauth/state";
import { normalizeStoreUrl } from "@/lib/integrations/woocommerce/validation";

const TEST_SECRET = "woocommerce-session-secret-with-minimum-length-123456";

describe("WooCommerce connect foundation", () => {
  it("normalizes a bare TasteWP host to https", () => {
    expect(normalizeStoreUrl("ancientcoach.s2-tastewp.com")).toBe(
      "https://ancientcoach.s2-tastewp.com",
    );
    expect(normalizeStoreUrl("https://ancientcoach.s2-tastewp.com/shop/")).toBe(
      "https://ancientcoach.s2-tastewp.com",
    );
    expect(normalizeStoreUrl("not a url")).toBeNull();
  });

  it("builds the WooCommerce authorize URL", () => {
    const url = buildAuthorizeUrl({
      store_url: "https://ancientcoach.s2-tastewp.com",
      user_id: "user-1",
      return_url: "https://app.example.com/onboarding/store?woocommerce=connected",
      callback_url: "https://app.example.com/api/integrations/woocommerce/callback?state=abc",
      app_name: "Confirma",
      scope: "read_write",
    });

    expect(url).toContain(
      "https://ancientcoach.s2-tastewp.com/wc-auth/v1/authorize",
    );
    expect(url).toContain("app_name=Confirma");
    expect(url).toContain("scope=read_write");
    expect(url).toContain("user_id=user-1");
  });

  it("signs and verifies store state", () => {
    const state = signStoreUrl(
      "https://ancientcoach.s2-tastewp.com",
      TEST_SECRET,
      "user-1",
    );
    const parsed = verifyState(state, TEST_SECRET, 60_000);
    expect(parsed?.storeUrl).toBe("https://ancientcoach.s2-tastewp.com");
    expect(parsed?.userId).toBe("user-1");
  });

  it("accepts a WooCommerce callback body with consumer credentials", () => {
    const result = verifyWooCommerceCallbackPayload({
      key_id: 1,
      user_id: "user-1",
      consumer_key: "ck_test",
      consumer_secret: "cs_test",
      key_permissions: "read_write",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.consumerKey).toBe("ck_test");
      expect(result.credentials.consumerSecret).toBe("cs_test");
    }
  });

  it("rejects a callback body without credentials", () => {
    expect(
      verifyWooCommerceCallbackPayload({
        user_id: "user-1",
        consumer_key: "",
        consumer_secret: "",
      }).ok,
    ).toBe(false);
  });
});
