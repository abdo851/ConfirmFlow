import { describe, expect, it, vi } from "vitest";
import { signShopifyWebhookBody } from "@/lib/integrations/shopify/webhooks/hmac";
import { ingestShopifyWebhook } from "@/lib/integrations/shopify/webhooks/ingest";
import { buildShopifyOrderBody } from "../fixtures/shopify-order";

const TEST_SECRET = "shopify-test-secret";
const STORE_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const EVENT_ID = "33333333-3333-3333-3333-333333333333";
const ORDER_ID = "44444444-4444-4444-4444-444444444444";
const OTHER_STORE_ID = "55555555-5555-5555-5555-555555555555";

vi.mock("@/lib/integrations/shopify/env", () => ({
  getShopifyOAuthEnv: () => ({
    SHOPIFY_API_SECRET: TEST_SECRET,
  }),
}));

function buildHeaders(body: string, webhookId = "wh_123") {
  return {
    "X-Shopify-Hmac-SHA256": signShopifyWebhookBody(body, TEST_SECRET),
    "X-Shopify-Shop-Domain": "demo.myshopify.com",
    "X-Shopify-Topic": "orders/create",
    "X-Shopify-Webhook-Id": webhookId,
  };
}

function createOrderIngestionMockDb(options: {
  connected?: boolean;
  existingEventIds?: string[];
  existingOrders?: Array<{ storeId: string; externalOrderId: string; id?: string }>;
  failOrderInsert?: boolean;
}) {
  const connected = options.connected ?? true;
  const existingEventIds = new Set(options.existingEventIds ?? []);
  const existingOrders = new Map<string, string>();

  for (const order of options.existingOrders ?? []) {
    existingOrders.set(
      `${order.storeId}:shopify:${order.externalOrderId}`,
      order.id ?? ORDER_ID,
    );
  }

  let orderInsertCount = 0;

  const db = {
    getOrderInsertCount: () => orderInsertCount,
    getOrderCount: () => existingOrders.size,
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

      if (table === "orders") {
        const filters: Record<string, string> = {};

        const builder = {
          select: () => builder,
          eq(field: string, value: string) {
            filters[field] = value;
            return builder;
          },
          maybeSingle: async () => {
            const key = `${filters.store_id}:shopify:${filters.external_order_id}`;
            const orderId = existingOrders.get(key);
            return {
              data: orderId ? { id: orderId } : null,
              error: null,
            };
          },
          insert: (row: {
            store_id: string;
            external_order_id: string;
            confirmation_status: string;
          }) => ({
            select: () => ({
              single: async () => {
                if (options.failOrderInsert) {
                  return {
                    data: null,
                    error: { message: "insert failed" },
                  };
                }

                const key = `${row.store_id}:shopify:${row.external_order_id}`;
                if (existingOrders.has(key)) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate" },
                  };
                }

                existingOrders.set(key, ORDER_ID);
                orderInsertCount += 1;
                return {
                  data: { id: ORDER_ID },
                  error: null,
                };
              },
            }),
          }),
        };

        return builder;
      }

      if (table === "store_webhook_events") {
        const filters: Record<string, string> = {};
        let inserted = false;

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
          insert: (row: { external_event_id: string; status: string }) => ({
            select: () => ({
              single: async () => {
                if (existingEventIds.has(row.external_event_id)) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate" },
                  };
                }

                existingEventIds.add(row.external_event_id);
                inserted = true;
                return { data: { id: EVENT_ID }, error: null };
              },
            }),
          }),
          get inserted() {
            return inserted;
          },
        };

        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return db;
}

describe("Shopify order ingestion via webhook", () => {
  it("persists a new order as pending", async () => {
    const body = buildShopifyOrderBody();
    const db = createOrderIngestionMockDb({});
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body),
      db: db as never,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("accepted");
    expect(result.orderId).toBe(ORDER_ID);
  });

  it("processes the same Shopify webhook only once when delivered sequentially", async () => {
    const body = buildShopifyOrderBody();
    const db = createOrderIngestionMockDb({});

    const first = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_seq"),
      db: db as never,
    });

    const second = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_seq"),
      db: db as never,
    });

    expect(first.status).toBe("accepted");
    expect(first.orderId).toBe(ORDER_ID);
    expect(second.status).toBe("duplicate");
    expect(second.eventId).toBe(EVENT_ID);
    expect(db.getOrderInsertCount()).toBe(1);
    expect(db.getOrderCount()).toBe(1);
  });

  it("does not create a duplicate order for duplicate webhook delivery", async () => {
    const body = buildShopifyOrderBody();
    const db = createOrderIngestionMockDb({
      existingEventIds: ["wh_123"],
      existingOrders: [{ storeId: STORE_ID, externalOrderId: "450789469" }],
    });

    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_123"),
      db: db as never,
    });

    expect(result.status).toBe("duplicate");
    expect(result.httpStatus).toBe(200);
  });

  it("does not create duplicate orders for the same external order ID", async () => {
    const body = buildShopifyOrderBody();
    const db = createOrderIngestionMockDb({
      existingOrders: [{ storeId: STORE_ID, externalOrderId: "450789469" }],
    });

    const first = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_100"),
      db: db as never,
    });

    const second = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_200"),
      db: db as never,
    });

    expect(first.orderId).toBe(ORDER_ID);
    expect(second.orderId).toBe(ORDER_ID);
    expect(second.status).toBe("accepted");
  });

  it("allows the same external order ID in different stores", async () => {
    const body = buildShopifyOrderBody();
    const dbStoreA = createOrderIngestionMockDb({
      existingOrders: [{ storeId: STORE_ID, externalOrderId: "450789469" }],
    });

    const dbStoreB = {
      ...createOrderIngestionMockDb({}),
      from(table: string) {
        if (table === "stores") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: OTHER_STORE_ID, owner_id: OWNER_ID },
                  error: null,
                }),
              }),
            }),
          };
        }

        return createOrderIngestionMockDb({}).from(table);
      },
    };

    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_other_store"),
      db: dbStoreB as never,
    });

    expect(result.status).toBe("accepted");
    expect(result.orderId).toBe(ORDER_ID);

    const storeAResult = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_store_a"),
      db: dbStoreA as never,
    });

    expect(storeAResult.orderId).toBe(ORDER_ID);
  });

  it("rejects malformed order payloads without recording webhook success", async () => {
    const body = JSON.stringify({ currency: "MAD" });
    const db = createOrderIngestionMockDb({});
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body),
      db: db as never,
    });

    expect(result.httpStatus).toBe(422);
    expect(result.status).toBe("rejected");
    expect(result.eventId).toBeUndefined();
  });

  it("does not mark webhook processed when order persistence fails", async () => {
    const body = buildShopifyOrderBody();
    const db = createOrderIngestionMockDb({ failOrderInsert: true });
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body, "wh_fail"),
      db: db as never,
    });

    expect(result.httpStatus).toBe(500);
    expect(result.status).toBe("rejected");
    expect(result.eventId).toBeUndefined();
  });

  it("rejects orders for unknown stores", async () => {
    const body = buildShopifyOrderBody();
    const result = await ingestShopifyWebhook({
      rawBody: body,
      headers: buildHeaders(body),
      db: createOrderIngestionMockDb({ connected: false }) as never,
    });

    expect(result.httpStatus).toBe(404);
    expect(result.status).toBe("rejected");
  });
});
