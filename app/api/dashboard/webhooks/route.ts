import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWebhooksForUser } from "@/lib/dashboard/get-webhooks-for-user";
import { createWooCommerceWebhook } from "@/lib/dashboard/woocommerce-webhook-actions";

const TOPICS = new Set([
  "order.created",
  "order.updated",
  "order.cancelled",
  "order.fulfilled",
  "order.paid",
]);

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await getWebhooksForUser({ owner_id: user.id });
  return NextResponse.json({ webhooks });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { topic?: unknown; targetUrl?: unknown; active?: unknown };
  try {
    body = (await request.json()) as { topic?: unknown; targetUrl?: unknown; active?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_topic" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic : "";
  const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl : "";
  const active = body.active !== false;
  if (!TOPICS.has(topic)) {
    return NextResponse.json({ error: "invalid_topic" }, { status: 400 });
  }

  try {
    const webhook = await createWooCommerceWebhook({
      ownerId: user.id,
      topic,
      targetUrl,
      active,
    });
    return NextResponse.json({ ok: true, webhook }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "create_failed";
    if (code === "invalid_url" || code === "invalid_topic") {
      return NextResponse.json({ error: code }, { status: 400 });
    }
    if (code === "no_store" || code === "store_required") {
      return NextResponse.json({ error: code }, { status: 422 });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 502 });
  }
}
