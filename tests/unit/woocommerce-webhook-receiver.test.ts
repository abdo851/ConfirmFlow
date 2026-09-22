import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptSecret } from "@/lib/integrations/woocommerce/oauth/crypto";
import { POST } from "@/app/api/integrations/woocommerce/webhooks/route";
import { signWooCommerceWebhookBody } from "@/lib/integrations/woocommerce/webhooks/hmac";
import { ingestWooCommerceWebhook } from "@/lib/integrations/woocommerce/webhooks/ingest";
import { buildWooCommerceOrderBody } from "../fixtures/woocommerce-order";

const SESSION_SECRET = "woocommerce-session-secret-with-minimum-length-123456";
const WEBHOOK_SECRET = "wc-webhook-secret";
const CONNECTION_ID = "cb3b692e-7bd9-4d21-a544-033a644d5499";
const STORE_ID = "71e24709-75a4-4f11-8d85-9f31e783d747";
const OWNER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";

type Row = Record<string, unknown>;

function createIngestDb(existingOrder?: Row) {
  const orders: Row[] = existingOrder ? [existingOrder] : [];
  const events: Row[] = [];
  let orderSeq = 1;
  let eventSeq = 1;

  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    let action: "select" | "insert" | "update" = "select";
    let payload: Row | null = null;

    const list = () => {
      if (table === "orders") {
        return orders;
      }
      if (table === "store_webhook_events") {
        return events;
      }
      return null;
    };

    const matches = (row: Row) =>
      filters.every(([key, value]) => row[key] === value);

    const run = () => {
      if (table === "store_connections") {
        const matchesConnection = filters.every(
          ([key, value]) =>
            (key === "id" && value === CONNECTION_ID) ||
            (key === "provider" && value === "woocommerce"),
        );
        return matchesConnection
          ? { id: CONNECTION_ID, store_id: STORE_ID }
          : null;
      }

      if (table === "stores") {
        return { id: STORE_ID, owner_id: OWNER_ID };
      }

      if (table === "woocommerce_connections") {
        return {
          store_url: "https://ancientcoach.s2-tastewp.com",
          webhook_ids: [],
        };
      }

      if (table === "woocommerce_connection_secrets") {
        return {
          encrypted_webhook_secret: encryptSecret(WEBHOOK_SECRET, SESSION_SECRET),
        };
      }

      const rows = list();
      if (!rows) {
        return null;
      }

      if (action === "insert" && payload) {
        const row = {
          ...payload,
          id: table === "orders" ? `order-${orderSeq++}` : `event-${eventSeq++}`,
        };
        rows.push(row);
        return row;
      }

      if (action === "update" && payload) {
        const found = rows.find((row) => matches(row));
        if (found) {
          Object.assign(found, payload);
        }
        return found ?? null;
      }

      return rows.filter((row) => matches(row));
    };

    const builder = {
      select() {
        return builder;
      },
      eq(key: string, value: unknown) {
        filters.push([key, value]);
        return builder;
      },
      insert(row: Row) {
        action = "insert";
        payload = row;
        return builder;
      },
      update(row: Row) {
        action = "update";
        payload = row;
        return builder;
      },
      async maybeSingle() {
        const result = run();
        const data = Array.isArray(result) ? (result[0] ?? null) : result;
        return { data, error: null };
      },
      async single() {
        const result = run();
        const data = Array.isArray(result) ? (result[0] ?? null) : result;
        return { data, error: data ? null : { message: "missing" } };
      },
      then(
        resolve: (value: { data: unknown; error: null }) => void,
        reject?: (reason: unknown) => void,
      ) {
        return Promise.resolve(run())
          .then((result) => ({ data: result, error: null }))
          .then(resolve, reject);
      },
    };

    return builder;
  }

  return {
    client: { from } as unknown as SupabaseClient,
    orders,
    events,
  };
}

function signedRequest(body: string, deliveryId = "delivery-1", topic = "order.created") {
  return {
    rawBody: body,
    connectionId: CONNECTION_ID,
    headers: {
      topic,
      deliveryId,
      signature: signWooCommerceWebhookBody(body, WEBHOOK_SECRET),
    },
  };
}

describe("WooCommerce webhook receiver", () => {
  beforeEach(() => {
    process.env.WOOCOMMERCE_SESSION_SECRET = SESSION_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  });

  it("rejects a request without a connection before touching the database", async () => {
    const response = await POST(
      new Request("http://localhost/api/integrations/woocommerce/webhooks", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 200 for a WooCommerce activation ping and does not create an order", async () => {
    const db = createIngestDb();
    const response = await POST(
      new Request(
        `http://localhost/api/integrations/woocommerce/webhooks?connection=${CONNECTION_ID}`,
        {
          method: "POST",
          body: "webhook_id=1",
        },
      ),
    );
    const result = await ingestWooCommerceWebhook({
      rawBody: "webhook_id=2",
      connectionId: CONNECTION_ID,
      headers: { topic: "", deliveryId: "", signature: "" },
      db: db.client,
    });

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ httpStatus: 200, status: "ignored" });
    expect(db.orders).toHaveLength(0);
    expect(db.events).toHaveLength(0);
  });

  it("returns 401 for a real order without a signature", async () => {
    const db = createIngestDb();
    const body = buildWooCommerceOrderBody();
    const result = await ingestWooCommerceWebhook({
      rawBody: body,
      connectionId: CONNECTION_ID,
      headers: {
        topic: "order.created",
        deliveryId: "delivery-unsigned",
        signature: "",
      },
      db: db.client,
    });

    expect(result.httpStatus).toBe(401);
    expect(db.orders).toHaveLength(0);
  });

  it("returns 200 for a real order with a valid signature", async () => {
    const db = createIngestDb();
    const body = buildWooCommerceOrderBody();
    const result = await ingestWooCommerceWebhook({
      ...signedRequest(body, "delivery-signed"),
      db: db.client,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.status).toBe("accepted");
    expect(db.orders).toHaveLength(1);
  });

  it("rejects an invalid signature", async () => {
    const db = createIngestDb();
    const body = buildWooCommerceOrderBody();
    const result = await ingestWooCommerceWebhook({
      ...signedRequest(body),
      headers: {
        topic: "order.created",
        deliveryId: "delivery-1",
        signature: "not-a-valid-signature",
      },
      db: db.client,
    });

    expect(result.httpStatus).toBe(401);
    expect(db.orders).toHaveLength(0);
  });

  it("persists a new order as pending and ignores a duplicate delivery", async () => {
    const db = createIngestDb();
    const body = buildWooCommerceOrderBody();
    const first = await ingestWooCommerceWebhook({
      ...signedRequest(body),
      db: db.client,
    });
    const second = await ingestWooCommerceWebhook({
      ...signedRequest(body),
      db: db.client,
    });

    expect(first).toMatchObject({ httpStatus: 200, status: "accepted" });
    expect(second).toMatchObject({ httpStatus: 200, status: "duplicate" });
    expect(db.orders).toHaveLength(1);
    expect(db.orders[0]?.confirmation_status).toBe("pending");
    expect(db.orders[0]?.provider).toBe("woocommerce");
    expect(db.events).toHaveLength(1);
  });

  it("updates order fields without overwriting confirmation status", async () => {
    const db = createIngestDb({
      id: "order-existing",
      store_id: STORE_ID,
      provider: "woocommerce",
      external_order_id: "120",
      confirmation_status: "confirmed",
    });
    const body = buildWooCommerceOrderBody({ status: "completed", total: "250.00" });
    const result = await ingestWooCommerceWebhook({
      ...signedRequest(body, "delivery-2", "order.updated"),
      db: db.client,
    });

    expect(result).toMatchObject({ httpStatus: 200, status: "accepted" });
    expect(db.orders[0]?.confirmation_status).toBe("confirmed");
    expect(db.orders[0]?.financial_status).toBe("completed");
    expect(db.orders[0]?.total_amount_minor).toBe(25000);
    expect(db.orders[0]).not.toHaveProperty("confirmation_status", "pending");
  });
});
