import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  MetaPersistenceError,
  parseMetaConnectionInput,
  persistMetaConnectionForUser,
  verifyMetaConnectionForUser,
} from "@/lib/integrations/meta";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseMetaConnectionInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid Meta configuration" }, { status: 400 });
  }

  try {
    await persistMetaConnectionForUser({
      userId: user.id,
      pixelId: parsed.value.pixelId,
      accessToken: parsed.value.accessToken,
    });

    const verification = await verifyMetaConnectionForUser({ userId: user.id });

    return NextResponse.json({
      success: true,
      status: "connected",
      verificationStatus: verification.status,
      message: verification.message,
    });
  } catch (error) {
    if (error instanceof MetaPersistenceError) {
      if (error.message.includes("another account")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (error.message.includes("Connect a store")) {
        return NextResponse.json(
          { error: "Store connection required" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Unable to save Meta configuration" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unable to save Meta configuration" },
      { status: 500 },
    );
  }
}
