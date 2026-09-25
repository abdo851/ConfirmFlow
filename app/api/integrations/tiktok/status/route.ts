import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTikTokConnectionPublicState } from "@/lib/integrations/tiktok/session/connection-store";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { provider: "tiktok", status: "error", errorMessage: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const state = await getTikTokConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        provider: "tiktok",
        status: "error",
        errorMessage: "Unable to read TikTok connection status.",
      },
      { status: 500 },
    );
  }
}
