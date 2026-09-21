import { NextResponse } from "next/server";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import { createDatabaseClient } from "@/lib/database/client";
import {
  WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS,
  getWooCommerceEnv,
  persistWooCommerceConnectionForUser,
  verifyState,
  verifyWooCommerceCallbackPayload,
} from "@/lib/integrations/woocommerce";

async function redirectWithReason(path: string): Promise<NextResponse> {
  const localizedPath = await getLocalizedPath(path);
  return NextResponse.redirect(buildAppPath(getAppBaseUrl(), localizedPath));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const success = searchParams.get("success");

  if (success === "1") {
    return redirectWithReason("/onboarding/store?woocommerce=connected");
  }

  return redirectWithReason(
    "/onboarding/store?woocommerce=error&reason=callback_failed",
  );
}

export async function POST(request: Request) {
  let env: ReturnType<typeof getWooCommerceEnv>;
  try {
    env = getWooCommerceEnv();
  } catch {
    return NextResponse.json({ error: "configuration" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const stateToken = searchParams.get("state");
  const state = stateToken
    ? verifyState(
        stateToken,
        env.WOOCOMMERCE_SESSION_SECRET,
        WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS * 1000,
      )
    : null;

  if (!state) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const verified = verifyWooCommerceCallbackPayload(body);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  if (verified.credentials.userId !== state.userId) {
    return NextResponse.json({ error: "user_mismatch" }, { status: 400 });
  }

  try {
    const db = createDatabaseClient();
    const { data: profile } = await db
      .from("profiles")
      .select("email")
      .eq("id", state.userId)
      .maybeSingle();

    await persistWooCommerceConnectionForUser({
      userId: state.userId,
      userEmail: profile?.email ?? "",
      storeUrl: state.storeUrl,
      consumerKey: verified.credentials.consumerKey,
      consumerSecret: verified.credentials.consumerSecret,
      scope: verified.credentials.keyPermissions,
    });
  } catch {
    return NextResponse.json({ error: "persistence_failed" }, { status: 400 });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
