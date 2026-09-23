import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getMetaConnectionPublicState();
  return NextResponse.json(state);
}
