import { describe, expect, it, vi, beforeEach } from "vitest";
import { classifyYouCanWebhookTopic } from "@/lib/integrations/youcan/webhooks/topics";
import { signYouCanWebhookBody } from "@/lib/integrations/youcan/webhooks/hmac";
import { ingestYouCanWebhook } from "@/lib/integrations/youcan/webhooks/ingest";
import { POST, GET } from "@/app/api/integrations/youcan/webhooks/route";
import { isYouCanWebhookPath } from "@/lib/auth/protection";
import { buildYouCanWebhookUrl } from "@/lib/config/app-url";
import { buildYouCanOrderBody } from "../fixtures/youcan-order";

const TEST_SECRET = "youcan-test-secret";
const STORE_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const EVENT_ID = "33333333-3333-3333-3333-333333333333";
const ORDER_ID = "44444444-4444-4444-4444-444444444444";
const YOUCAN_STORE_ID = "00000000-0000-0000-0000-000000000099";

vi.mock("@/lib/integrations/youcan/env", () => ({
  getYouCanOAuthEnv: () => ({
    YOUCAN_API_SECRET: TEST_SECRET,
  }),
}));

function buildHeaders(input: {
  body: string;
  topic?: string;
  deliveryId?: string;
  signature?: string;
}) {
  const signature =
    input.signature ?? signYouCanWebhookBody(input.body, TEST_SECRET);

  return {
    "X-YOUCAN-SIGNATURE": signature,
    "X-YOUCAN-TOPIC": input.topic ?? "order.created",
    "X-YOUCAN-DELIVERY-ID": input.deliveryId ?? "delivery_123",
  };
}

function createMockDb(options: {
  connected?: boolean;
  existingEventIds?: string[];
  existingOrders?: string[];
}) {
  const connected = options.connected ?? true;
  const existingEventIds = new Set(options.existingEventIds ?? []);
  const existingOrders = new Set(options.existingOrders ?? []);

  return {
    from(table: string) {
      if (table === "youcan_connections") {
        return {
          select: () => ({
            eq: (_field: string, value: string) => ({
              maybeSingle: async () => ({
                data:
                  connected && value === YOUCAN_STORE_ID
                    ? {
                        store_connection_id: "conn_1",
                        store_slug: "my-store",
                      }
                    : null,
                error: null,
              }),
            }),
            is: () => ({
              maybeSingle: async () => ({ data: [], error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }

      if (table === "store_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: connected
                  ? { store_id: STORE_ID, status: "active" }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: connected
                  ? { id: STORE_ID, owner_id: OWNER_ID }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "orders") {
        const filters: Record<string, string> = {};

        const builder = {
          select: () => builder,
          eq(field: string, value: string) {
            filters[field] = value;
            return builder;
          },
          maybeSingle: async () => {
            const externalOrderId = filters.external_order_id;
            const exists = externalOrderId
              ? existingOrders.has(externalOrderId)
              : false;

            return {
              data: exists ? { id: ORDER_ID } : null,
              error: null,
            };
          },
          insert: (row: { external_order_id: string }) => ({
            select: () => ({
              single: async () => {
                if (existingOrders.has(row.external_order_id)) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate" },
                  };
                }

                existingOrders.add(row.external_order_id);
                return { data: { id: ORDER_ID }, error: null };
              },
            }),
          }),
        };

        return builder;
      }

      if (table === "store_webhook_events") {
        const filters: Record<string, string> = {};

        const builder = {
          select: () => builder,
          eq(field: string, value: string) {
            filters[field] = value;
            return builder;
          },
          maybeSingle: async () => {
            const externalEventId = filters.external_event_id;
            const exists = externalEventId
              ? existingEventIds.has(externalEventId)
              : false;

            return {
              data: exists ? { id: EVENT_ID } : null,
              error: null,
            };
          },
          insert: (row: { external_event_id: string }) => ({
            select: () => ({
              single: async () => {
                if (existingEventIds.has(row.external_event_id)) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate" },
                  };
                }

                existingEventIds.add(row.external_event_id);
                return { data: { id: EVENT_ID }, error: null };
              },
            }),
          }),
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("YouCan webhook ingestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies order.created as accepted", () => {
    expect(classifyYouCanWebhookTopic("order.created")).toBe("accepted");
    expect(classifyYouCanWebhookTopic("order.updated")).toBe("unsupported");
  });

  it("accepts a first webhook for a known store", async () => {
    const body = buildYouCanOrderBody();
    const result = await ingestYouCanWebhook({
      rawBody: body,
      headers: buildHeaders({ body }),
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("accepted");
    expect(result.eventId).toBe(EVENT_ID);
    expect(result.orderId).toBe(ORDER_ID);
  });

  it("detects duplicate delivery IDs", async () => {
    const body = buildYouCanOrderBody();
    const result = await ingestYouCanWebhook({
      rawBody: body,
      headers: buildHeaders({ body, deliveryId: "delivery_123" }),
      db: createMockDb({ existingEventIds: ["delivery_123"] }) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("duplicate");
  });

  it("rejects invalid HMAC signatures", async () => {
    const body = buildYouCanOrderBody();
    const result = await ingestYouCanWebhook({
      rawBody: body,
      headers: buildHeaders({ body, signature: "invalid" }),
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(401);
    expect(result.status).toBe("rejected");
  });

  it("rejects unknown stores", async () => {
    const body = buildYouCanOrderBody({ storeId: "unknown-store-id" });
    const result = await ingestYouCanWebhook({
      rawBody: body,
      headers: buildHeaders({ body }),
      db: createMockDb({ connected: false }) as never,
    });

    expect(result.httpStatus).toBe(404);
    expect(result.status).toBe("rejected");
  });

  it("does not expose secrets in API responses", async () => {
    const body = buildYouCanOrderBody();
    const request = new Request("http://localhost/api/integrations/youcan/webhooks", {
      method: "POST",
      headers: buildHeaders({ body }),
      body,
    });

    vi.spyOn(
      await import("@/lib/integrations/youcan/webhooks/ingest"),
      "ingestYouCanWebhook",
    ).mockResolvedValueOnce({
      status: "accepted",
      eventId: EVENT_ID,
      orderId: ORDER_ID,
      httpStatus: 200,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(JSON.stringify(payload)).not.toContain(TEST_SECRET);
    expect(payload).toEqual({
      status: "accepted",
      eventId: EVENT_ID,
      orderId: ORDER_ID,
    });
  });

  it("accepts POST and rejects unsupported methods", async () => {
    expect(isYouCanWebhookPath("/api/integrations/youcan/webhooks")).toBe(true);

    const getResponse = await GET();
    expect(getResponse.status).toBe(405);
  });

  it("builds locale-independent webhook URLs from configuration", () => {
    const url = buildYouCanWebhookUrl("https://app.example.com");
    expect(url).toBe("https://app.example.com/api/integrations/youcan/webhooks");
    expect(url).not.toContain("/en/");
  });
});
