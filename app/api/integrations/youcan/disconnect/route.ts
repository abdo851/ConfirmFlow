import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { YouCanDisconnectError } from "@/lib/integrations/youcan/disconnect";
import { YouCanPersistenceError } from "@/lib/integrations/youcan/persistence";
import { clearYouCanConnection } from "@/lib/integrations/youcan/session";
import { YouCanWebhookRegistrationError } from "@/lib/integrations/youcan/webhooks/register";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearYouCanConnection();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof YouCanDisconnectError && error.message === "unauthenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof YouCanWebhookRegistrationError ||
      error instanceof YouCanPersistenceError
    ) {
      return NextResponse.json(
        { error: "Unable to disconnect YouCan store." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to disconnect YouCan store." },
      { status: 500 },
    );
  }
}
