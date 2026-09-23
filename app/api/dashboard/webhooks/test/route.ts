import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { sendWooCommerceWebhookPing } from "@/lib/dashboard/test-woocommerce-webhook";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let connectionId: string | undefined;
  try {
    const body = (await request.json()) as { connectionId?: string };
    connectionId = body.connectionId;
  } catch {
    connectionId = undefined;
  }

  const ok = await sendWooCommerceWebhookPing(user.id, connectionId);
  return NextResponse.json({ success: ok }, { status: ok ? 200 : 400 });
}
