import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";
import { dispatchCustomShippingForOrder, type CustomDispatchConnection, type CustomDispatchOrder } from "@/lib/integrations/shipping/custom/dispatch";
import { probeHttpsUrl } from "@/lib/integrations/shipping/custom/probe";
import { customCarrierInputSchema } from "@/lib/integrations/shipping/custom/schema";
import { openValue, sealValue, signBody } from "@/lib/integrations/shipping/custom/seal";
import { toPublicCarrier } from "@/lib/integrations/shipping/custom/public";

const order: CustomDispatchOrder = {
  id: "order-1",
  orderNumber: "1001",
  externalOrderId: "ext-1",
  provider: "youcan",
  customerName: "Amina",
  customerPhone: "0600000000",
  customerEmail: null,
  city: "Casablanca",
  addressLine: "Street 1",
  currency: "MAD",
  totalAmountMinor: 15000,
  lineItems: [{ name: "Item", quantity: 1 }],
};

function connection(partial: Partial<CustomDispatchConnection>): CustomDispatchConnection {
  return {
    id: "conn-1",
    connectionType: "webhook",
    webhookUrl: "https://carrier.example/hook",
    signingSecret: "sign-secret",
    apiBaseUrl: null,
    apiKey: null,
    apiAuthType: null,
    createShipmentPath: null,
    ...partial,
  };
}

describe("custom shipping dispatch", () => {
  it("posts a signed webhook and continues when another connection fails", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes("broken")) {
        throw new Error("down");
      }
      return new Response("ok", { status: 200 });
    });

    const summary = await dispatchCustomShippingForOrder("order-1", "owner-1", {
      loadOrder: async () => order,
      loadConnections: async () => [
        connection({ id: "hook", signingSecret: "sign-secret" }),
        connection({ id: "broken", webhookUrl: "https://broken.example/hook", signingSecret: null }),
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(summary).toEqual({ sent: 1, failed: 1 });
    const firstCall = fetchImpl.mock.calls[0] as [string, RequestInit?] | undefined;
    const headers = new Headers(firstCall?.[1]?.headers);
    const body = String(firstCall?.[1]?.body);
    expect(headers.get("X-Confirma-Signature")).toBe(signBody(body, "sign-secret"));
    expect(headers.get("X-Confirma-Signature")).toBe(createHmac("sha256", "sign-secret").update(body).digest("hex"));
  });

  it("calls the carrier API with bearer auth and does not send an unconfirmed order", async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), headers: new Headers(init?.headers) });
      return new Response("ok", { status: 201 });
    });
    const summary = await dispatchCustomShippingForOrder("order-1", "owner-1", {
      loadOrder: async () => order,
      loadConnections: async () => [
        connection({
          connectionType: "api",
          webhookUrl: null,
          signingSecret: null,
          apiBaseUrl: "https://api.carrier.example/",
          apiKey: "live-key",
          apiAuthType: "bearer",
          createShipmentPath: "/shipments",
        }),
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(summary.sent).toBe(1);
    expect(calls[0]?.url).toBe("https://api.carrier.example/shipments");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer live-key");

    const skipped = await dispatchCustomShippingForOrder("order-1", "owner-1", {
      loadOrder: async () => null,
      loadConnections: async () => {
        throw new Error("should not load");
      },
      fetchImpl,
    });
    expect(skipped).toEqual({ sent: 0, failed: 0 });
  });
});

describe("custom carrier input", () => {
  it("accepts an https webhook and rejects http", () => {
    expect(
      customCarrierInputSchema.safeParse({
        name: "Local carrier",
        connectionType: "webhook",
        webhookUrl: "https://hooks.example/in",
        active: true,
      }).success,
    ).toBe(true);
    expect(
      customCarrierInputSchema.safeParse({
        name: "Local carrier",
        connectionType: "webhook",
        webhookUrl: "http://hooks.example/in",
        active: true,
      }).success,
    ).toBe(false);
  });

  it("does not expose sealed values on the public carrier", () => {
    const secret = "test-shipping-key";
    const packed = sealValue("super-secret-value", secret);
    expect(openValue(packed, secret)).toBe("super-secret-value");
    const pub = toPublicCarrier({
      id: "1",
      owner_id: "owner",
      name: "Carrier",
      connection_type: "api",
      status: "active",
      created_at: "2026-09-29T00:00:00.000Z",
      webhook_url: null,
      api_base_url: "https://api.example",
      api_auth_type: "bearer",
      create_shipment_path: "/shipments",
      hmac_secret_encrypted: packed,
      api_key_encrypted: packed,
    });
    expect(pub.hasApiKey).toBe(true);
    expect(JSON.stringify(pub)).not.toContain("super-secret-value");
    expect(JSON.stringify(pub)).not.toContain(packed);
  });
});

describe("custom carrier probe", () => {
  it("does not call the network for a non-https address", async () => {
    const fetchImpl = vi.fn();
    const result = await probeHttpsUrl("http://carrier.example", fetchImpl as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, status: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
