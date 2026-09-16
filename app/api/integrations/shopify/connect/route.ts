import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import {
  getShopifyOAuthEnv,
  getShopifyRedirectUri,
} from "@/lib/integrations/shopify/env";
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  SHOPIFY_OAUTH_STATE_TTL_SECONDS,
  buildShopifyAuthorizeUrl,
  createOAuthState,
  normalizeShopDomain,
} from "@/lib/integrations/shopify/oauth";
import { setShopifyConnectingFlag } from "@/lib/integrations/shopify/session";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    const loginPath = await getLocalizedPath("/login");
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  try {
    const env = getShopifyOAuthEnv();
    const { searchParams } = new URL(request.url);
    const shop = normalizeShopDomain(searchParams.get("shop") ?? "");

    if (!shop) {
      const errorPath = await getLocalizedPath(
        "/onboarding/store?shopify=error&reason=invalid_shop",
      );
      return NextResponse.redirect(new URL(errorPath, request.url));
    }

    const { state } = createOAuthState(shop, env.SHOPIFY_SESSION_SECRET);
    await setShopifyConnectingFlag();

    const response = NextResponse.redirect(
      buildShopifyAuthorizeUrl({
        shop,
        clientId: env.SHOPIFY_API_KEY,
        scopes: env.SHOPIFY_OAUTH_SCOPES,
        redirectUri: getShopifyRedirectUri(),
        state,
      }),
    );

    response.cookies.set(SHOPIFY_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SHOPIFY_OAUTH_STATE_TTL_SECONDS,
    });

    return response;
  } catch {
    const errorPath = await getLocalizedPath(
      "/onboarding/store?shopify=error&reason=configuration",
    );
    return NextResponse.redirect(new URL(errorPath, request.url));
  }
}
