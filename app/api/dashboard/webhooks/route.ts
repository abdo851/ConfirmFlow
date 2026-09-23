import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWebhooksForUser } from "@/lib/dashboard/get-webhooks-for-user";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await getWebhooksForUser({ owner_id: user.id });
  return NextResponse.json({ webhooks });
}
