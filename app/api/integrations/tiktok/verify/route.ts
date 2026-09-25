import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { TikTokPersistenceError } from "@/lib/integrations/tiktok/persistence";
import { verifyTikTokConnectionForUser } from "@/lib/integrations/tiktok/verification/verify-credentials";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await verifyTikTokConnectionForUser({ ownerId: user.id });
    return NextResponse.json({
      ok: result.status === "verified",
      verificationStatus: result.status,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof TikTokPersistenceError && error.message.includes("not found")) {
      return NextResponse.json({ error: "TikTok connection not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to verify TikTok credentials" }, { status: 500 });
  }
}
