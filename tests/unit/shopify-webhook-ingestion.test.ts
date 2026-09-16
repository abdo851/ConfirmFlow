import { describe, expect, it, vi, beforeEach } from "vitest";
import { normalizeShopDomain } from "@/lib/integrations/shopify/oauth/shop-domain";
import { classifyShopifyWebhookTopic } from "@/lib/integrations/shopify/webhooks/topics";
import { signShopifyWebhookBody } from "@/lib/integrations/shopify/webhooks/hmac";
import { ingestShopifyWebhook } from "@/lib/integrations/shopify/webhooks/ingest";
import { POST, GET } from "@/app/api/integrations/shopify/webhooks/route";
import { isShopifyWebhookPath } from "@/lib/auth/protection";
import { buildShopifyWebhookUrl } from "@/lib/config/app-url";

const TEST_SECRET = "shopify-test-secret";
const STORE_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const EVENT_ID = "33333333-3333-3333-3333-333333333333";

vi.mock("@/lib/integrations/shopify/env", () => ({
  getShopifyOAuthEnv: () => ({
    SHOPIFY_API_SECRET: TEST_SECRET,
  }),
}));

function buildHeaders(input: {
  body: string;
  shopDomain?: string;
  topic?: string;
  webhookId?: string;
  hmac?: string;
}) {
  const hmac =
    input.hmac ?? signShopifyWebhookBody(input.body, TEST_SECRET);

  return {
    "X-Shopify-Hmac-SHA256": hmac,
    "X-Shopify-Shop-Domain": input.shopDomain ?? "demo.myshopify.com",
    "X-Shopify-Topic": input.topic ?? "orders/create",
    "X-Shopify-Webhook-Id": input.webhookId ?? "wh_123",
  };
}

function createMockDb(options: {
  connected?: boolean;
  existingEventIds?: string[];
}) {
  const connected = options.connected ?? true;
  const existingEventIds = new Set(options.existingEventIds ?? []);

  return {
    from(table: string) {
      if (table === "shopify_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: connected
                  ? { store_connection_id: "conn_1" }
                  : null,
                error: null,
              }),
            }),
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

describe("Shopify webhook ingestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes shop domains", () => {
    expect(normalizeShopDomain("Demo.myshopify.com")).toBe("demo.myshopify.com");
    expect(normalizeShopDomain("demo")).toBe("demo.myshopify.com");
    expect(normalizeShopDomain("invalid domain")).toBeNull();
  });

  it("classifies orders/create as accepted and other topics as unsupported", () => {
    expect(classifyShopifyWebhookTopic("orders/create")).toBe("accepted");
    expect(classifyShopifyWebhookTopic("products/update")).toBe("unsupported");
  });

  it("accepts a first webhook for a known shop", async () => {
    const body = JSON.stringify({ id: 1001 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body }),
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("accepted");
    expect(result.eventId).toBe(EVENT_ID);
  });

  it("detects duplicate webhook IDs", async () => {
    const body = JSON.stringify({ id: 1001 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body, webhookId: "wh_123" }),
      db: createMockDb({ existingEventIds: ["wh_123"] }) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("duplicate");
  });

  it("accepts a different webhook ID for the same shop", async () => {
    const body = JSON.stringify({ id: 1002 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body, webhookId: "wh_456" }),
      db: createMockDb({ existingEventIds: ["wh_123"] }) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("accepted");
  });

  it("rejects invalid HMAC signatures", async () => {
    const body = JSON.stringify({ id: 1001 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body, hmac: "invalid" }),
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(401);
    expect(result.status).toBe("rejected");
  });

  it("rejects missing webhook ID header", async () => {
    const body = JSON.stringify({ id: 1001 });
    const headers = {
      "X-Shopify-Hmac-SHA256": signShopifyWebhookBody(body, TEST_SECRET),
      "X-Shopify-Shop-Domain": "demo.myshopify.com",
      "X-Shopify-Topic": "orders/create",
    };

    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers,
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(400);
    expect(result.status).toBe("rejected");
  });

  it("rejects unknown shops", async () => {
    const body = JSON.stringify({ id: 1001 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body, shopDomain: "unknown.myshopify.com" }),
      db: createMockDb({ connected: false }) as never,
    });

    expect(result.httpStatus).toBe(404);
    expect(result.status).toBe("rejected");
  });

  it("handles unsupported topics without pretending they were processed", async () => {
    const body = JSON.stringify({ id: 55 });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders({ body, topic: "products/update" }),
      db: createMockDb({}) as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("unsupported");
  });

  it("does not expose secrets in API responses", async () => {
    const body = JSON.stringify({ id: 1001 });
    const request = new Request("http://localhost/api/integrations/shopify/webhooks", {
      method: "POST",
      headers: buildHeaders({ body }),
      body,
    });

    vi.spyOn(
      await import("@/lib/integrations/shopify/webhooks/ingest"),
      "ingestShopifyWebhook",
    ).mockResolvedValueOnce({
      status: "accepted",
      eventId: EVENT_ID,
      httpStatus: 200,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(JSON.stringify(payload)).not.toContain(TEST_SECRET);
    expect(JSON.stringify(payload)).not.toContain("shpat_");
    expect(payload).toEqual({ status: "accepted", eventId: EVENT_ID });
  });

  it("accepts POST and rejects unsupported methods", async () => {
    expect(isShopifyWebhookPath("/api/integrations/shopify/webhooks")).toBe(true);

    const getResponse = await GET();
    expect(getResponse.status).toBe(405);
  });

  it("builds locale-independent webhook URLs from configuration", () => {
    const url = buildShopifyWebhookUrl("https://app.example.com");
    expect(url).toBe("https://app.example.com/api/integrations/shopify/webhooks");
    expect(url).not.toContain("/en/");
  });
});
