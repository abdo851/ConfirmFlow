import { beforeEach, describe, expect, it, vi } from "vitest";

const persist = vi.hoisted(() => vi.fn());
const registerOrderWebhooks = vi.hoisted(() => vi.fn());

const SESSION_SECRET = "woocommerce-session-secret-with-minimum-length-123456";

vi.mock("@/lib/integrations/woocommerce", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/integrations/woocommerce")
  >("@/lib/integrations/woocommerce");
  return {
    ...actual,
    getWooCommerceEnv: () => ({
      WOOCOMMERCE_SESSION_SECRET: SESSION_SECRET,
      WOOCOMMERCE_APP_NAME: "Confirma",
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
    }),
    persistWooCommerceConnectionForUser: persist,
  };
});

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === "profiles"
                ? { email: "merchant@example.com" }
                : { webhook_ids: [] },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

vi.mock("@/lib/integrations/woocommerce/webhooks/register", () => ({
  buildWooCommerceWebhookDeliveryUrl: () =>
    "https://app.example.com/api/webhooks/woocommerce/conn-1",
  generateWooCommerceWebhookSecret: () => "webhook-secret-not-logged",
  registerOrderWebhooks,
}));

vi.mock("@/lib/integrations/woocommerce/webhooks/unregister", () => ({
  unregisterWebhooks: vi.fn(),
}));

import { POST } from "@/app/api/integrations/woocommerce/callback/route";
import { signStoreUrl } from "@/lib/integrations/woocommerce/oauth/state";
import { logger } from "@/lib/logging/logger";

describe("WooCommerce callback route", () => {
  beforeEach(() => {
    persist.mockReset();
    persist.mockResolvedValue({
      storeId: "store-1",
      storeConnectionId: "conn-1",
    });
    registerOrderWebhooks.mockReset();
    registerOrderWebhooks.mockResolvedValue(["1", "2"]);
  });

  it("rejects an invalid state and does not persist", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const response = await POST(
      new Request(
        "https://app.example.com/api/integrations/woocommerce/callback?state=not-a-valid-state",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ user_id: "user-1" }),
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_state" });
    expect(persist).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("woocommerce_callback_received", {
      hasState: true,
    });
    expect(info).toHaveBeenCalledWith("woocommerce_callback_state_invalid", {
      hasState: true,
    });
    info.mockRestore();
  });

  it("accepts a valid state and persists the connection", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const state = signStoreUrl(
      "https://humorousdirt.s2-tastewp.com",
      SESSION_SECRET,
      "user-1",
    );
    const response = await POST(
      new Request(
        `https://app.example.com/api/integrations/woocommerce/callback?state=${encodeURIComponent(state)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key_id: 1,
            user_id: "user-1",
            consumer_key: "ck_test",
            consumer_secret: "cs_test",
            key_permissions: "read_write",
          }),
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("OK");
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        storeUrl: "https://humorousdirt.s2-tastewp.com",
        consumerKey: "ck_test",
        consumerSecret: "cs_test",
      }),
    );
    expect(info).toHaveBeenCalledWith("woocommerce_callback_success", {
      store_url: "https://humorousdirt.s2-tastewp.com",
    });
    info.mockRestore();
  });
});
