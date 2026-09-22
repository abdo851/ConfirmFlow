import { describe, expect, it } from "vitest";
import { normalizeWooCommerceOrder } from "@/lib/integrations/woocommerce/orders/normalize";
import { wooCommerceOrderSchema } from "@/lib/integrations/woocommerce/orders/schema";
import { buildWooCommerceOrder } from "../fixtures/woocommerce-order";

describe("WooCommerce order normalization", () => {
  it("maps a WooCommerce order into minor units and billing fields", () => {
    const parsed = wooCommerceOrderSchema.parse(buildWooCommerceOrder());
    const normalized = normalizeWooCommerceOrder(parsed);

    expect(normalized).toMatchObject({
      externalOrderId: "120",
      orderNumber: "120",
      customerEmail: "customer@example.com",
      customerPhone: "+212600000000",
      currency: "MAD",
      subtotalAmountMinor: 22900,
      totalAmountMinor: 22900,
      financialStatus: "processing",
    });
    expect(normalized?.providerCreatedAt?.toISOString()).toBe(
      "2024-06-01T12:00:00.000Z",
    );
  });

  it("returns null when currency or total is missing", () => {
    const missingTotal = wooCommerceOrderSchema.parse(
      buildWooCommerceOrder({ total: undefined }),
    );
    const missingCurrency = wooCommerceOrderSchema.parse(
      buildWooCommerceOrder({ currency: " " }),
    );

    expect(normalizeWooCommerceOrder(missingTotal)).toBeNull();
    expect(normalizeWooCommerceOrder(missingCurrency)).toBeNull();
  });
});
