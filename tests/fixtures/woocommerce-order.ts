export function buildWooCommerceOrder(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 120,
    number: "120",
    status: "processing",
    currency: "MAD",
    total: "229.00",
    date_created_gmt: "2024-06-01T12:00:00",
    billing: {
      email: "customer@example.com",
      phone: "+212600000000",
    },
    ...overrides,
  };
}

export function buildWooCommerceOrderBody(
  overrides: Record<string, unknown> = {},
) {
  return JSON.stringify(buildWooCommerceOrder(overrides));
}
