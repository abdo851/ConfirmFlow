import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { reregisterWooCommerceWebhooks } from "@/lib/dashboard/woocommerce-webhook-actions";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await reregisterWooCommerceWebhooks(user.id);
    return NextResponse.json({ success: true, count: result.count });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
