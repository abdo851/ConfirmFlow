import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  TikTokPersistenceError,
  persistTikTokConnection,
} from "@/lib/integrations/tiktok/persistence";
import { parseTikTokConnectionInput } from "@/lib/integrations/tiktok/validation";

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

  const parsed = parseTikTokConnectionInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid TikTok configuration" }, { status: 400 });
  }

  try {
    await persistTikTokConnection({
      owner_id: user.id,
      pixel_code: parsed.value.pixelCode,
      access_token: parsed.value.accessToken,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TikTokPersistenceError) {
      if (error.message.includes("another account")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (error.message.includes("Connect a store")) {
        return NextResponse.json({ error: "Store connection required" }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Unable to save TikTok configuration" }, { status: 500 });
  }
}
