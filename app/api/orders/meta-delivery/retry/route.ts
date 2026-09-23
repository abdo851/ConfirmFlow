import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
  if (!body?.orderId) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await processMetaPurchaseDelivery({ orderId: body.orderId, userId: user.id });
  return NextResponse.json({
    success: result?.status === "sent",
    status: result?.status ?? "failed",
    message: result?.message ?? null,
  });
}
