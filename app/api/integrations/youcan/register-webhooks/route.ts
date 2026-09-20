import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import {
  registerYouCanWebhooksForStore,
  YouCanWebhookRegistrationError,
  toSafeWebhookRegistrationResponse,
} from "@/lib/integrations/youcan/webhooks/register";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .eq("platform", "youcan")
    .limit(1);

  if (storesError) {
    return NextResponse.json(
      { error: "Unable to resolve YouCan store." },
      { status: 500 },
    );
  }

  const storeId = stores?.[0]?.id;
  if (!storeId) {
    return NextResponse.json(
      { error: "No connected YouCan store found." },
      { status: 404 },
    );
  }

  try {
    const result = await registerYouCanWebhooksForStore(storeId);
    return NextResponse.json(toSafeWebhookRegistrationResponse(result));
  } catch (error) {
    if (error instanceof YouCanWebhookRegistrationError) {
      return NextResponse.json(
        {
          error: "Unable to register YouCan webhooks.",
          reason: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to register YouCan webhooks." },
      { status: 500 },
    );
  }
}
