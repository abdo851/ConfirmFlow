import { beforeEach, describe, expect, it, vi } from "vitest";
import { forwardOrderToCodeNetworkSeller } from "@/lib/integrations/cod-network-seller/forwarder";

const mockFrom = vi.fn();
const mockUnseal = vi.fn();
const mockCreateOrder = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/integrations/cod-network-seller/crypto", () => ({
  unsealToken: (value: string) => mockUnseal(value),
}));

vi.mock("@/lib/integrations/cod-network-seller/client", () => ({
  createCodeNetworkSellerClient: () => ({ createOrder: mockCreateOrder }),
}));

type Row = Record<string, unknown>;

const state: {
  connection: Row | null;
  sent: Row | null;
  order: Row | null;
  inserts: Row[];
  insertThrows: boolean;
} = {
  connection: null,
  sent: null,
  order: null,
  inserts: [],
  insertThrows: false,
};

function chain(data: Row | null) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data, error: null }),
    insert: async (payload: Row) => {
      if (state.insertThrows) {
        throw new Error("insert failed");
      }
      state.inserts.push(payload);
      return { error: null };
    },
  };
  return builder;
}

function activeConnection() {
  return { id: "conn-1", status: "active", api_token_encrypted: "sealed-token" };
}

function readyOrder(phone: string | null = "+212600000000", extra: Row = {}) {
  return {
    id: "order-1",
    owner_id: "owner-1",
    customer_name: "Amina",
    customer_phone: phone,
    city: "Casablanca",
    address_line: "Street 1",
    line_items: [{ sku: "SKU-1", quantity: 1, price: 50 }],
    total_amount_minor: 5000,
    ...extra,
  };
}

describe("COD Network seller forwarder", () => {
  beforeEach(() => {
    state.connection = null;
    state.sent = null;
    state.order = null;
    state.inserts = [];
    state.insertThrows = false;
    mockFrom.mockReset();
    mockUnseal.mockReset();
    mockCreateOrder.mockReset();
    mockUnseal.mockReturnValue("plain-token");
    mockFrom.mockImplementation((table: string) => {
      if (table === "cod_network_connections") return chain(state.connection);
      if (table === "orders") return chain(state.order);
      return chain(state.sent);
    });
  });

  it("skips when no connection row exists", async () => {
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "skipped" });
    expect(state.inserts).toEqual([
      expect.objectContaining({ status: "skipped", order_id: "order-1", provider_id: "cod_network_seller" }),
    ]);
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("skips when the connection is inactive", async () => {
    state.connection = { ...activeConnection(), status: "disconnected" };
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "skipped" });
    expect(state.inserts[0]?.status).toBe("skipped");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("returns duplicate when a sent log already exists", async () => {
    state.connection = activeConnection();
    state.sent = { id: "log-1" };
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "duplicate" });
    expect(state.inserts[0]?.status).toBe("duplicate");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("returns duplicate when the client reports a duplicate lead", async () => {
    state.connection = activeConnection();
    state.order = readyOrder();
    mockCreateOrder.mockRejectedValue(new Error("cod_network_seller_duplicate_lead"));
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "duplicate" });
    expect(state.inserts.at(-1)?.status).toBe("duplicate");
  });

  it("returns sent and stores the external order id", async () => {
    state.connection = activeConnection();
    state.order = readyOrder();
    mockCreateOrder.mockResolvedValue({ id: 99, reference: "REF-1", status_name: "new" });
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "sent" });
    const log = state.inserts.at(-1);
    expect(log).toEqual(
      expect.objectContaining({
        status: "sent",
        external_order_id: "99",
        external_reference: "REF-1",
        http_status: 201,
      }),
    );
    expect(JSON.stringify(log)).not.toContain("plain-token");
    expect(JSON.stringify(log)).not.toContain("sealed-token");
  });

  it("returns failed when the client throws a generic error", async () => {
    state.connection = activeConnection();
    state.order = readyOrder();
    mockCreateOrder.mockRejectedValue(new Error("cod_network_seller_http_500"));
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "failed" });
    expect(state.inserts.at(-1)).toEqual(
      expect.objectContaining({ status: "failed", error_message: "cod_network_seller_http_500" }),
    );
  });

  it("returns failed when the phone is missing", async () => {
    state.connection = activeConnection();
    state.order = readyOrder(null);
    const result = await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(result).toEqual({ status: "failed" });
    expect(state.inserts.at(-1)?.error_message).toContain("missing_required_fields:phone");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("infers country from the phone", async () => {
    state.connection = activeConnection();
    mockCreateOrder.mockResolvedValue({ id: 1, reference: null, status_name: null });

    state.order = readyOrder("+966501234567");
    await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(mockCreateOrder.mock.calls.at(-1)?.[0].country).toBe("SA");

    state.inserts = [];
    state.order = readyOrder("+971501234567");
    await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(mockCreateOrder.mock.calls.at(-1)?.[0].country).toBe("AE");

    state.inserts = [];
    state.order = readyOrder("+212600000000");
    await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(mockCreateOrder.mock.calls.at(-1)?.[0].country).toBe("MA");

    state.order = readyOrder(null);
    await forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" });
    expect(state.inserts.at(-1)?.payload_summary).toEqual(expect.objectContaining({ country: "MA", used_default_country: true }));
  });

  it("does not throw when the log insert fails", async () => {
    state.insertThrows = true;
    await expect(forwardOrderToCodeNetworkSeller({ ownerId: "owner-1", orderId: "order-1" })).resolves.toEqual({
      status: "skipped",
    });
  });
});
