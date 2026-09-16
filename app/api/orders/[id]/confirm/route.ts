import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { confirmOrder, dispatchPurchaseDeliveryAfterConfirmation } from "@/lib/confirmation";

const METHOD_NOT_ALLOWED = NextResponse.json(
  { error: "Method not allowed" },
  { status: 405 },
);

type PurchaseDeliveryOutcome = NonNullable<
  Awaited<ReturnType<typeof dispatchPurchaseDeliveryAfterConfirmation>>
>;

function buildMetaPurchaseDeliveryResponse(delivery: PurchaseDeliveryOutcome | null) {
  if (!delivery) {
    return undefined;
  }

  return {
    status: delivery.status,
    eventId: delivery.eventId,
    message: delivery.message,
  };
}

function mapConfirmResultToResponse(
  result: Awaited<ReturnType<typeof confirmOrder>>,
  delivery: PurchaseDeliveryOutcome | null,
) {
  const metaPurchaseDelivery = buildMetaPurchaseDeliveryResponse(delivery);

  switch (result.status) {
    case "confirmed":
      return NextResponse.json(
        {
          status: result.status,
          orderId: result.orderId,
          confirmedAt: result.confirmedAt,
          metaPurchaseDelivery,
        },
        { status: 200 },
      );
    case "already_confirmed":
      return NextResponse.json(
        {
          status: result.status,
          orderId: result.orderId,
          confirmedAt: result.confirmedAt,
          metaPurchaseDelivery,
        },
        { status: 200 },
      );
    case "not_found":
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    case "invalid_state":
      return NextResponse.json({ error: "Invalid order state" }, { status: 409 });
    default:
      return NextResponse.json({ error: "Unable to confirm order" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const result = await confirmOrder({
      orderId: orderId.trim(),
      actor: { userId: user.id },
    });

    let delivery: PurchaseDeliveryOutcome | null = null;
    if (result.status === "confirmed" || result.status === "already_confirmed") {
      delivery = await dispatchPurchaseDeliveryAfterConfirmation({
        orderId: result.orderId ?? orderId.trim(),
        userId: user.id,
        createIfMissing: result.status === "confirmed",
      });
    }

    return mapConfirmResultToResponse(result, delivery);
  } catch {
    return NextResponse.json({ error: "Unable to confirm order" }, { status: 500 });
  }
}

export async function GET() {
  return METHOD_NOT_ALLOWED;
}

export async function PUT() {
  return METHOD_NOT_ALLOWED;
}

export async function PATCH() {
  return METHOD_NOT_ALLOWED;
}

export async function DELETE() {
  return METHOD_NOT_ALLOWED;
}
