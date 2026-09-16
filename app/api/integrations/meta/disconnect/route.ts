import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { clearMetaConnection } from "@/lib/integrations/meta/session";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearMetaConnection();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to disconnect Meta." },
      { status: 500 },
    );
  }
}
