import { NextResponse } from "next/server";
import { extractWooCommerceHeaders } from "@/lib/integrations/woocommerce/webhooks/headers";
import { ingestWooCommerceWebhook } from "@/lib/integrations/woocommerce/webhooks/ingest";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const connectionId = new URL(request.url).searchParams.get("connection") ?? "";
  const result = await ingestWooCommerceWebhook({
    rawBody,
    headers: extractWooCommerceHeaders(request),
    connectionId,
  });

  if (result.httpStatus === 401) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (result.httpStatus !== 200) {
    return NextResponse.json({ error: "ingest_failed" }, { status: result.httpStatus });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
