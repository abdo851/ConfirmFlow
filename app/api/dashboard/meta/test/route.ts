import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await createUserDatabaseClient();
  const { data: order } = await db
    .from("orders")
    .select("id")
    .eq("owner_id", user.id)
    .eq("confirmation_status", "confirmed")
    .order("confirmed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ success: false, message: "no_confirmed_order" }, { status: 404 });
  }

  const result = await processMetaPurchaseDelivery({ orderId: order.id, userId: user.id });
  return NextResponse.json({
    success: result?.status === "sent",
    status: result?.status ?? "failed",
    message: result?.message ?? null,
  });
}
