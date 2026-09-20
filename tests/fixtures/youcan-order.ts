export function buildYouCanOrderBody(input?: {
  orderId?: string;
  storeId?: string;
  ref?: string;
  total?: number;
  currency?: string;
  email?: string;
  phone?: string;
}) {
  return JSON.stringify({
    event_name: "order.created",
    event_happened_at: "2026-08-08T21:30:00.000000Z",
    data: {
      id: input?.orderId ?? "00000000-0000-0000-0000-000000000001",
      ref: input?.ref ?? "10245",
      status: 1,
      status_text: "pending",
      total: input?.total ?? 249.9,
      currency: input?.currency ?? "MAD",
      store_id: input?.storeId ?? "00000000-0000-0000-0000-000000000099",
      created_at: "2026-08-08T21:30:00.000000Z",
      customer: {
        email: input?.email ?? "buyer@example.com",
        phone: input?.phone ?? "+212600000000",
      },
    },
  });
}
