import { NextResponse } from "next/server";
import { ingestShopifyWebhook } from "@/lib/integrations/shopify/webhooks";

const METHOD_NOT_ALLOWED = NextResponse.json(
  { error: "Method not allowed" },
  { status: 405 },
);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  const result = await ingestShopifyWebhook({ rawBody, headers });

  const body =
    result.status === "rejected"
      ? { error: result.message ?? "rejected" }
      : {
          status: result.status,
          ...(result.eventId ? { eventId: result.eventId } : {}),
        };

  return NextResponse.json(body, { status: result.httpStatus });
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
