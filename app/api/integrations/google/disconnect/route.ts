import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { clearGoogleConnection } from "@/lib/integrations/google/session/connection-store";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearGoogleConnection();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to disconnect Google." }, { status: 500 });
  }
}
