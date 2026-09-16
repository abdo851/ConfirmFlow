export function buildShopifyOrderPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 450789469,
    order_number: 1001,
    email: "customer@example.com",
    phone: "+212600000000",
    currency: "MAD",
    subtotal_price: "225.00",
    total_price: "229.00",
    financial_status: "pending",
    created_at: "2024-06-01T12:00:00+01:00",
    ...overrides,
  };
}

export function buildShopifyOrderBody(
  overrides: Record<string, unknown> = {},
): string {
  return JSON.stringify(buildShopifyOrderPayload(overrides));
}
