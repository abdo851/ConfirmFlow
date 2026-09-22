export interface OrderCsvRow {
  orderNumber: string | null;
  externalOrderId: string;
  customerEmail: string | null;
  customerPhone: string | null;
  currency: string;
  totalAmountMinor: number;
  confirmationStatus: string;
  receivedAt: string;
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function ordersToCsv(orders: OrderCsvRow[]): string {
  const header = [
    "order_number",
    "external_order_id",
    "customer_email",
    "customer_phone",
    "currency",
    "total_amount_minor",
    "confirmation_status",
    "received_at",
  ];

  const lines = orders.map((order) =>
    [
      order.orderNumber ?? "",
      order.externalOrderId,
      order.customerEmail ?? "",
      order.customerPhone ?? "",
      order.currency,
      String(order.totalAmountMinor),
      order.confirmationStatus,
      order.receivedAt,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
