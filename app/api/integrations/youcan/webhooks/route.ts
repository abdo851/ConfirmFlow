import { NextResponse } from "next/server";
import { ingestYouCanWebhook } from "@/lib/integrations/youcan/webhooks";

const METHOD_NOT_ALLOWED = NextResponse.json(
  { error: "Method not allowed" },
  { status: 405 },
);

export async function POST(request: Request) {
  const startedAt = Date.now();
  console.log("[youcan webhook] received");

  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    const result = await ingestYouCanWebhook({ rawBody, headers });

    const body =
      result.status === "rejected"
        ? { error: result.message ?? "rejected" }
        : {
            status: result.status,
            ...(result.eventId ? { eventId: result.eventId } : {}),
            ...(result.orderId ? { orderId: result.orderId } : {}),
          };

    console.log(`[youcan webhook] done in ${Date.now() - startedAt}ms`);
    return NextResponse.json(body, { status: result.httpStatus });
  } catch (error) {
    console.error("[youcan webhook] failed:", error);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 200 },
    );
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
