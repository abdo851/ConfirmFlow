import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  MetaPersistenceError,
  verifyMetaConnectionForUser,
} from "@/lib/integrations/meta";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await verifyMetaConnectionForUser({ userId: user.id });

    return NextResponse.json({
      success: result.status === "verified",
      verificationStatus: result.status,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof MetaPersistenceError) {
      if (error.message === "Meta connection not found.") {
        return NextResponse.json(
          { error: "Meta connection not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: "Unable to verify Meta credentials" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unable to verify Meta credentials" },
      { status: 500 },
    );
  }
}
