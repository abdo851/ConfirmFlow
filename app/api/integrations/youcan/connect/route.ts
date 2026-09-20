import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import {
  getYouCanOAuthEnv,
  getYouCanRedirectUri,
  parseYouCanOAuthScopes,
} from "@/lib/integrations/youcan/env";
import {
  YOUCAN_OAUTH_STATE_COOKIE,
  YOUCAN_OAUTH_STATE_TTL_SECONDS,
  buildYouCanAuthorizeUrl,
  createOAuthState,
  normalizeStoreSlug,
} from "@/lib/integrations/youcan/oauth";
import { setYouCanConnectingFlag } from "@/lib/integrations/youcan/session";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    const loginPath = await getLocalizedPath("/login");
    return NextResponse.redirect(buildAppPath(getAppBaseUrl(), loginPath));
  }

  try {
    const env = getYouCanOAuthEnv();
    const { searchParams } = new URL(request.url);
    const storeSlug = normalizeStoreSlug(searchParams.get("store") ?? "");

    if (!storeSlug) {
      const errorPath = await getLocalizedPath(
        "/onboarding/store?youcan=error&reason=invalid_store",
      );
      return NextResponse.redirect(buildAppPath(getAppBaseUrl(), errorPath));
    }

    const { state } = createOAuthState(storeSlug, env.YOUCAN_SESSION_SECRET);
    await setYouCanConnectingFlag();

    const response = NextResponse.redirect(
      buildYouCanAuthorizeUrl({
        clientId: env.YOUCAN_API_KEY,
        redirectUri: getYouCanRedirectUri(),
        state,
        scopes: parseYouCanOAuthScopes(env.YOUCAN_OAUTH_SCOPES),
      }),
    );

    response.cookies.set(YOUCAN_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: YOUCAN_OAUTH_STATE_TTL_SECONDS,
    });

    return response;
  } catch {
    const errorPath = await getLocalizedPath(
      "/onboarding/store?youcan=error&reason=configuration",
    );
    return NextResponse.redirect(buildAppPath(getAppBaseUrl(), errorPath));
  }
}
