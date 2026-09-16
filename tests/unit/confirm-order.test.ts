import { describe, expect, it, vi } from "vitest";
import { confirmOrder } from "@/lib/confirmation/confirm-order";
import { normalizeShopifyOrder } from "@/lib/integrations/shopify/orders/normalize";
import { parseShopifyOrderPayload } from "@/lib/integrations/shopify/orders/parse";
import { buildShopifyOrderBody } from "../fixtures/shopify-order";

const ORDER_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_OWNER_ID = "33333333-3333-3333-3333-333333333333";
const STORE_ID = "44444444-4444-4444-4444-444444444444";

type OrderRow = {
  id: string;
  owner_id: string;
  store_id: string;
  confirmation_status: "pending" | "confirmed";
  confirmed_at: string | null;
};

function createConfirmationMockDb(initialOrders: Record<string, OrderRow>) {
  const orders = new Map(Object.entries(initialOrders));
  let updateCalls = 0;

  return {
    get updateCalls() {
      return updateCalls;
    },
    from(table: string) {
      if (table !== "orders") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const filters: Record<string, string> = {};

      const builder = {
        select: () => builder,
        eq(field: string, value: string) {
          filters[field] = value;
          return builder;
        },
        update: (values: {
          confirmation_status: "confirmed";
          confirmed_at: string;
        }) => {
          updateCalls += 1;
          const updateFilters: Record<string, string> = {};

          const updateBuilder = {
            eq(field: string, value: string) {
              updateFilters[field] = value;
              return updateBuilder;
            },
            select: () => ({
              maybeSingle: async () => {
                const order = orders.get(updateFilters.id);
                if (
                  !order ||
                  order.owner_id !== updateFilters.owner_id ||
                  order.confirmation_status !== updateFilters.confirmation_status
                ) {
                  return { data: null, error: null };
                }

                order.confirmation_status = values.confirmation_status;
                order.confirmed_at = values.confirmed_at;
                orders.set(order.id, order);

                return {
                  data: {
                    id: order.id,
                    confirmed_at: order.confirmed_at,
                  },
                  error: null,
                };
              },
            }),
          };

          return updateBuilder;
        },
        maybeSingle: async () => {
          const order = filters.id ? orders.get(filters.id) ?? null : null;
          return { data: order, error: null };
        },
      };

      return builder;
    },
    orders,
  };
}

describe("confirmOrder service", () => {
  it("transitions a pending order to confirmed", async () => {
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "pending",
        confirmed_at: null,
      },
    });

    const result = await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
      confirmedAt: new Date("2024-06-02T10:00:00.000Z"),
    });

    expect(result.status).toBe("confirmed");
    expect(result.orderId).toBe(ORDER_ID);
    expect(result.confirmedAt).toBe("2024-06-02T10:00:00.000Z");
    expect(db.orders.get(ORDER_ID)?.confirmation_status).toBe("confirmed");
  });

  it("returns already_confirmed for repeated confirmation", async () => {
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "confirmed",
        confirmed_at: "2024-06-02T10:00:00.000Z",
      },
    });

    const result = await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
      confirmedAt: new Date("2024-06-03T10:00:00.000Z"),
    });

    expect(result.status).toBe("already_confirmed");
    expect(result.confirmedAt).toBe("2024-06-02T10:00:00.000Z");
    expect(db.orders.get(ORDER_ID)?.confirmed_at).toBe("2024-06-02T10:00:00.000Z");
  });

  it("returns not_found for missing orders", async () => {
    const db = createConfirmationMockDb({});

    const result = await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
    });

    expect(result.status).toBe("not_found");
  });

  it("returns forbidden for the wrong owner", async () => {
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "pending",
        confirmed_at: null,
      },
    });

    const result = await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OTHER_OWNER_ID },
      db: db as never,
    });

    expect(result.status).toBe("forbidden");
  });

  it("prevents two successful pending → confirmed transitions under concurrency", async () => {
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "pending",
        confirmed_at: null,
      },
    });

    const [first, second] = await Promise.all([
      confirmOrder({
        orderId: ORDER_ID,
        actor: { userId: OWNER_ID },
        db: db as never,
        confirmedAt: new Date("2024-06-02T10:00:00.000Z"),
      }),
      confirmOrder({
        orderId: ORDER_ID,
        actor: { userId: OWNER_ID },
        db: db as never,
        confirmedAt: new Date("2024-06-02T10:00:01.000Z"),
      }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual(["already_confirmed", "confirmed"]);
    expect(db.orders.get(ORDER_ID)?.confirmed_at).toBe("2024-06-02T10:00:00.000Z");
  });

  it("does not accept client-controlled confirmation fields in the service API", async () => {
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "pending",
        confirmed_at: null,
      },
    });

    await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
      confirmedAt: new Date("2024-06-02T10:00:00.000Z"),
    });

    const repeat = await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
      confirmedAt: new Date("2099-01-01T00:00:00.000Z"),
    });

    expect(repeat.status).toBe("already_confirmed");
    expect(db.orders.get(ORDER_ID)?.confirmed_at).toBe("2024-06-02T10:00:00.000Z");
  });

  it("keeps newly ingested Shopify orders pending and does not auto-confirm from financial_status", () => {
    const parsed = parseShopifyOrderPayload(
      buildShopifyOrderBody({ financial_status: "paid" }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const order = normalizeShopifyOrder(parsed.payload, {
      storeId: STORE_ID,
      ownerId: OWNER_ID,
      receivedAt: new Date(),
    });

    expect(order.confirmationStatus).toBe("pending");
    expect(order.financialStatus).toBe("paid");
  });

  it("does not invoke Meta APIs during confirmation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const db = createConfirmationMockDb({
      [ORDER_ID]: {
        id: ORDER_ID,
        owner_id: OWNER_ID,
        store_id: STORE_ID,
        confirmation_status: "pending",
        confirmed_at: null,
      },
    });

    await confirmOrder({
      orderId: ORDER_ID,
      actor: { userId: OWNER_ID },
      db: db as never,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
