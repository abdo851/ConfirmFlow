import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      {
        provider: "meta",
        status: "error",
        errorMessage: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const state = await getMetaConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        provider: "meta",
        status: "error",
        errorMessage: "Unable to read Meta connection status.",
      },
      { status: 500 },
    );
  }
}
