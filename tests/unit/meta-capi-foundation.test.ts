import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MetaMarketingAdapter } from "@/integrations/marketing/meta/meta-marketing-adapter";
import {
  buildPurchaseConversionEvent,
  buildPurchaseEventId,
  validateConversionEvent,
} from "@/lib/conversions";
import { minorUnitsToMajorAmount } from "@/lib/orders/money";
import { MetaCapiClient } from "@/lib/integrations/meta/capi/client";
import { buildMetaCapiEventsUrl } from "@/lib/integrations/meta/capi/config";
import {
  hashMetaEmail,
  hashMetaPhone,
  normalizeMetaEmail,
  normalizeMetaPhone,
} from "@/lib/integrations/meta/capi/hash-user-data";
import { buildMetaCapiPayload } from "@/lib/integrations/meta/capi/payload-builder";

const ORDER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ORDER_ID = "22222222-2222-2222-2222-222222222222";
const EVENT_TIME = 1_716_854_400;

function buildSamplePurchaseEvent(orderId = ORDER_ID) {
  return buildPurchaseConversionEvent({
    orderId,
    eventTime: EVENT_TIME,
    currency: "MAD",
    valueMinor: 22900,
    email: "Customer@Example.com",
    phone: "+212600000000",
  });
}

describe("Purchase conversion event contract", () => {
  it("builds a valid provider-independent Purchase event", () => {
    const event = buildSamplePurchaseEvent();
    const validated = validateConversionEvent(event);

    expect(validated.ok).toBe(true);
    expect(event.eventName).toBe("Purchase");
    expect(event.actionSource).toBe("server");
    expect(event.customData.currency).toBe("MAD");
    expect(event.customData.valueMinor).toBe(22900);
  });

  it("rejects invalid conversion events", () => {
    expect(
      validateConversionEvent({
        eventName: "Purchase",
        eventId: "",
        eventTime: 0,
        actionSource: "server",
        userData: {},
        customData: { currency: "MAD", valueMinor: 100 },
      }).ok,
    ).toBe(false);

    expect(
      validateConversionEvent({
        eventName: "Purchase",
        eventId: "purchase:1",
        eventTime: EVENT_TIME,
        actionSource: "server",
        userData: {},
        customData: { currency: "US", valueMinor: 100 },
      }).ok,
    ).toBe(false);
  });

  it("keeps core events free of Meta-specific payload structure", () => {
    const event = buildSamplePurchaseEvent();
    const serialized = JSON.stringify(event);

    expect(serialized).not.toContain("event_name");
    expect(serialized).not.toContain("user_data");
    expect(serialized).not.toContain("custom_data");
    expect(serialized).not.toContain("action_source");
  });
});

describe("deterministic event_id contract", () => {
  it("derives stable purchase event IDs from order identity", () => {
    expect(buildPurchaseEventId(ORDER_ID)).toBe(`purchase:${ORDER_ID}`);
    expect(buildPurchaseEventId(ORDER_ID)).toBe(buildPurchaseEventId(ORDER_ID));
    expect(buildPurchaseEventId(OTHER_ORDER_ID)).not.toBe(
      buildPurchaseEventId(ORDER_ID),
    );
  });

  it("does not change event IDs between repeated payload builds", () => {
    const event = buildSamplePurchaseEvent();
    const first = buildMetaCapiPayload(event).data[0]?.event_id;
    const second = buildMetaCapiPayload(event).data[0]?.event_id;

    expect(first).toBe(`purchase:${ORDER_ID}`);
    expect(second).toBe(first);
  });

  it("uses caller-supplied server event_time", () => {
    const event = buildPurchaseConversionEvent({
      orderId: ORDER_ID,
      eventTime: EVENT_TIME,
      currency: "USD",
      valueMinor: 1000,
    });

    expect(event.eventTime).toBe(EVENT_TIME);
    expect(buildMetaCapiPayload(event).data[0]?.event_time).toBe(EVENT_TIME);
  });
});

describe("Meta user data hashing", () => {
  it("normalizes email before hashing", () => {
    expect(normalizeMetaEmail("  Customer@Example.com ")).toBe(
      "customer@example.com",
    );
    expect(hashMetaEmail("Customer@Example.com")).toBe(
      createHash("sha256").update("customer@example.com", "utf8").digest("hex"),
    );
  });

  it("normalizes phone before hashing", () => {
    expect(normalizeMetaPhone("+212 (600) 000-000")).toBe("212600000000");
    expect(hashMetaPhone("+212600000000")).toBe(
      createHash("sha256").update("212600000000", "utf8").digest("hex"),
    );
  });
});

describe("Meta CAPI payload builder", () => {
  it("maps Purchase events to Meta CAPI payload fields", () => {
    const event = buildSamplePurchaseEvent();
    const payload = buildMetaCapiPayload(event);
    const metaEvent = payload.data[0];

    expect(metaEvent?.event_name).toBe("Purchase");
    expect(metaEvent?.event_id).toBe(`purchase:${ORDER_ID}`);
    expect(metaEvent?.event_time).toBe(EVENT_TIME);
    expect(metaEvent?.action_source).toBe("website");
    expect(metaEvent?.custom_data.currency).toBe("MAD");
    expect(metaEvent?.custom_data.value).toBe(
      minorUnitsToMajorAmount(22900, "MAD"),
    );
    expect(metaEvent?.user_data.em?.[0]).toBe(
      hashMetaEmail("Customer@Example.com"),
    );
    expect(metaEvent?.user_data.ph?.[0]).toBe(hashMetaPhone("+212600000000"));
  });

  it("does not include secrets or internal authorization data", () => {
    const payload = buildMetaCapiPayload(buildSamplePurchaseEvent());
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toMatch(/access[_-]?token/i);
    expect(serialized).not.toContain("owner_id");
    expect(serialized).not.toContain("store_id");
    expect(serialized).not.toContain("customer@example.com");
    expect(serialized).not.toContain("+212600000000");
  });

  it("centralizes Graph API URL construction", () => {
    expect(buildMetaCapiEventsUrl("123456789012345")).toContain(
      "graph.facebook.com",
    );
    expect(buildMetaCapiEventsUrl("123456789012345")).toContain(
      "123456789012345/events",
    );
  });
});

describe("Meta CAPI client boundary", () => {
  it("does not perform network calls without an injected transport", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const client = new MetaCapiClient();
    const result = await client.sendEvent({
      pixelId: "123456789012345",
      accessToken: "secret-token",
      event: buildSamplePurchaseEvent(),
    });

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses injected transport only when explicitly provided in tests", async () => {
    const transport = {
      send: vi.fn(async () => ({ status: 200 as const })),
    };
    const client = new MetaCapiClient(transport);

    const result = await client.sendEvent({
      pixelId: "123456789012345",
      accessToken: "secret-token",
      event: buildSamplePurchaseEvent(),
    });

    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    const transportCall = transport.send.mock.calls[0] as unknown as
      | [string, unknown, string]
      | undefined;
    expect(JSON.stringify(transportCall?.[1] ?? {})).not.toContain("secret-token");
  });
});

describe("Meta marketing adapter boundary", () => {
  it("builds Meta payloads without dispatching Purchase events", async () => {
    const adapter = new MetaMarketingAdapter();
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const payload = adapter.buildPurchasePayload(buildSamplePurchaseEvent());
    const dispatch = await adapter.sendConversion({
      eventType: "purchase",
      orderId: ORDER_ID,
      storeId: "store-1",
    });

    expect(payload.data[0]?.event_name).toBe("Purchase");
    expect(dispatch.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("confirmation flow remains Meta-free", () => {
  it("does not invoke Meta from the confirmation service", () => {
    const confirmSource = readFileSync(
      join(process.cwd(), "lib/confirmation/confirm-order.ts"),
      "utf8",
    );
    const confirmRouteSource = readFileSync(
      join(process.cwd(), "app/api/orders/[id]/confirm/route.ts"),
      "utf8",
    );

    expect(confirmSource).not.toMatch(/integrations\/meta/);
    expect(confirmSource).not.toMatch(/MetaCapi/);
    expect(confirmRouteSource).not.toMatch(/integrations\/meta/);
    expect(confirmRouteSource).not.toMatch(/MetaCapi/);
  });
});
