import { describe, expect, it } from "vitest";
import { normalizeShopifyOrder } from "@/lib/integrations/shopify/orders/normalize";
import { parseShopifyOrderPayload } from "@/lib/integrations/shopify/orders/parse";
import { parseMoneyStringToMinorUnits } from "@/lib/orders/money";
import { buildShopifyOrderBody, buildShopifyOrderPayload } from "../fixtures/shopify-order";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";

describe("Shopify order normalization", () => {
  it("normalizes a valid Shopify order payload", () => {
    const parsed = parseShopifyOrderPayload(buildShopifyOrderBody());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const order = normalizeShopifyOrder(parsed.payload, {
      storeId: STORE_ID,
      ownerId: OWNER_ID,
      receivedAt: new Date("2024-06-01T13:00:00.000Z"),
    });

    expect(order.externalOrderId).toBe("450789469");
    expect(order.orderNumber).toBe("1001");
    expect(order.customerEmail).toBe("customer@example.com");
    expect(order.customerPhone).toBe("+212600000000");
    expect(order.currency).toBe("MAD");
    expect(order.subtotalAmountMinor).toBe(22500);
    expect(order.totalAmountMinor).toBe(22900);
    expect(order.financialStatus).toBe("pending");
    expect(order.confirmationStatus).toBe("pending");
    expect(order.storeId).toBe(STORE_ID);
    expect(order.ownerId).toBe(OWNER_ID);
  });

  it("rejects missing Shopify order ID", () => {
    const parsed = parseShopifyOrderPayload(
      buildShopifyOrderBody({ id: "" }),
    );
    expect(parsed.ok).toBe(false);
  });

  it("rejects invalid order ID type payloads", () => {
    const parsed = parseShopifyOrderPayload(
      JSON.stringify({ currency: "MAD", subtotal_price: "1.00", total_price: "1.00" }),
    );
    expect(parsed.ok).toBe(false);
  });

  it("allows optional customer fields to be absent", () => {
    const parsed = parseShopifyOrderPayload(
      buildShopifyOrderBody({ email: null, phone: null }),
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

    expect(order.customerEmail).toBeNull();
    expect(order.customerPhone).toBeNull();
  });

  it("normalizes money into integer minor units", () => {
    expect(parseMoneyStringToMinorUnits("229.00", "MAD")).toBe(22900);
    expect(parseMoneyStringToMinorUnits("1000", "JPY")).toBe(1000);
  });

  it("preserves the original currency", () => {
    const parsed = parseShopifyOrderPayload(
      buildShopifyOrderBody({ currency: "usd", total_price: "10.00", subtotal_price: "10.00" }),
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

    expect(order.currency).toBe("USD");
  });

  it("does not include raw Shopify payload fields in the normalized order", () => {
    const payload = buildShopifyOrderPayload({
      note: "secret note",
      line_items: [{ id: 1, title: "Shirt" }],
    });
    const parsed = parseShopifyOrderPayload(JSON.stringify(payload));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const order = normalizeShopifyOrder(parsed.payload, {
      storeId: STORE_ID,
      ownerId: OWNER_ID,
      receivedAt: new Date(),
    });

    expect(order).not.toHaveProperty("line_items");
    expect(order).not.toHaveProperty("note");
  });
});
