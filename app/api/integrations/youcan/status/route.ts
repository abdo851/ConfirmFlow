import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getYouCanConnectionPublicState } from "@/lib/integrations/youcan/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      {
        provider: "youcan",
        status: "error",
        errorMessage: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const state = await getYouCanConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        provider: "youcan",
        status: "error",
        errorMessage: "Unable to read YouCan connection status.",
      },
      { status: 500 },
    );
  }
}
