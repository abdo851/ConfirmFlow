import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { deleteWooCommerceWebhook } from "@/lib/dashboard/woocommerce-webhook-actions";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { connectionId?: string; webhookId?: string } | null;
  if (!body?.connectionId || !body.webhookId) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    await deleteWooCommerceWebhook({
      ownerId: user.id,
      connectionId: body.connectionId,
      webhookId: body.webhookId,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
