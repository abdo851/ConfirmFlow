import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { GooglePersistenceError } from "@/lib/integrations/google/persistence";
import { verifyGoogleConnectionForUser } from "@/lib/integrations/google/verification/verify-credentials";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await verifyGoogleConnectionForUser({ ownerId: user.id });
    return NextResponse.json({
      ok: result.status === "verified",
      verificationStatus: result.status,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof GooglePersistenceError && error.message.includes("not found")) {
      return NextResponse.json({ error: "Google connection not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to verify Google credentials" }, { status: 500 });
  }
}
