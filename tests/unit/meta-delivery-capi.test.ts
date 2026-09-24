import { describe, expect, it, vi } from "vitest";
import { buildPurchaseConversionEvent } from "@/lib/conversions/purchase-event";
import { buildMetaCapiEventsUrl } from "@/lib/integrations/meta/capi/config";
import { hashMetaEmail, hashMetaPhone } from "@/lib/integrations/meta/capi/hash-user-data";
import { buildMetaCapiPayload } from "@/lib/integrations/meta/capi/payload-builder";
import { loadEligibleMetaConnectionForStore } from "@/lib/integrations/meta/delivery/eligibility";
import { encryptSecret } from "@/lib/integrations/shopify/oauth/crypto";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";
const STORE_ID = "9e1d1728-8146-447f-b8cd-51b4bb5d74ea";
const CONNECTION_ID = "a1ec2779-061d-4f4f-8768-5d68afb321cf";
const PIXEL_ID = "4444157855871429";
const SESSION_SECRET = "test-meta-session-secret-minimum-length-1234";
const ACCESS_TOKEN = "meta-access-token";

vi.mock("@/lib/integrations/meta/env", () => ({
  getMetaEnv: () => ({
    META_SESSION_SECRET: "test-meta-session-secret-minimum-length-1234",
  }),
}));

describe("Meta Purchase eligibility", () => {
  it("returns eligible when the store has an active verified Meta connection", async () => {
    const encryptedAccessToken = encryptSecret(ACCESS_TOKEN, SESSION_SECRET);
    const db = {
      from(table: string) {
        if (table === "stores") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: STORE_ID }, error: null }),
                }),
              }),
            }),
          };
        }

        if (table === "store_connections") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      maybeSingle: async () => ({
                        data: { id: CONNECTION_ID },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "meta_connections") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    pixel_id: PIXEL_ID,
                    verification_status: "verified",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "meta_connection_secrets") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { encrypted_access_token: encryptedAccessToken },
                  error: null,
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

    const result = await loadEligibleMetaConnectionForStore({
      userId: USER_ID,
      storeId: STORE_ID,
      db: db as never,
    });

    expect(result).toEqual({
      eligible: true,
      connection: {
        pixelId: PIXEL_ID,
        accessToken: ACCESS_TOKEN,
      },
    });
  });
});

describe("Meta Purchase payload", () => {
  it("builds a Purchase for 23 USD with hashed customer data and the pixel events URL", () => {
    const event = buildPurchaseConversionEvent({
      orderId: "01969cc3-3462-4e9d-a379-028566c6e340",
      eventTime: 1_758_739_400,
      currency: "USD",
      valueMinor: 2300,
      email: "Buyer@Example.com",
      phone: "+1 555 0100",
    });
    const payload = buildMetaCapiPayload(event);
    const purchase = payload.data[0];

    expect(purchase?.event_name).toBe("Purchase");
    expect(purchase?.custom_data).toEqual({ currency: "USD", value: 23 });
    expect(purchase?.user_data.em).toEqual([hashMetaEmail("Buyer@Example.com")]);
    expect(purchase?.user_data.em?.[0]).toHaveLength(64);
    expect(purchase?.user_data.ph).toEqual([hashMetaPhone("+1 555 0100")]);
    expect(JSON.stringify(payload)).not.toContain("Buyer@Example.com");
    expect(JSON.stringify(payload)).not.toContain(ACCESS_TOKEN);
    expect(buildMetaCapiEventsUrl(PIXEL_ID)).toBe(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`,
    );
  });
});
