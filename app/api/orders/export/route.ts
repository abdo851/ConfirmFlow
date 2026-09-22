import { NextResponse } from "next/server";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";
import { ordersToCsv } from "@/lib/orders/csv";

export async function POST() {
  const result = await getOrdersForAuthenticatedUser();
  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csv = ordersToCsv(
    result.orders.map((order) => ({
      orderNumber: order.orderNumber,
      externalOrderId: order.externalOrderId,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      currency: order.currency,
      totalAmountMinor: order.totalAmountMinor,
      confirmationStatus: order.confirmationStatus,
      receivedAt: order.receivedAt,
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
