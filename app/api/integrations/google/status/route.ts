import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getGoogleConnectionPublicState } from "@/lib/integrations/google/session/connection-store";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { provider: "google", status: "error", errorMessage: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const state = await getGoogleConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        provider: "google",
        status: "error",
        errorMessage: "Unable to read Google connection status.",
      },
      { status: 500 },
    );
  }
}
