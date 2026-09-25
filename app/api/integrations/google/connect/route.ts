import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  GooglePersistenceError,
  persistGoogleConnection,
} from "@/lib/integrations/google/persistence";
import { parseGoogleConnectionInput } from "@/lib/integrations/google/validation";

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

  const parsed = parseGoogleConnectionInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid Google configuration" }, { status: 400 });
  }

  try {
    await persistGoogleConnection({
      owner_id: user.id,
      conversion_id: parsed.value.conversionId,
      conversion_label: parsed.value.conversionLabel,
      access_token: parsed.value.accessToken,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof GooglePersistenceError) {
      if (error.message.includes("another account")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (error.message.includes("Connect a store")) {
        return NextResponse.json({ error: "Store connection required" }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Unable to save Google configuration" }, { status: 500 });
  }
}
