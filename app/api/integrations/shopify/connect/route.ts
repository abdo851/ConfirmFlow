import { NextResponse } from "next/server";
import { getShopifyOAuthEnv, getShopifyRedirectUri } from "@/lib/integrations/shopify/env";
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  SHOPIFY_OAUTH_STATE_TTL_SECONDS,
  buildShopifyAuthorizeUrl,
  createOAuthState,
  normalizeShopDomain,
} from "@/lib/integrations/shopify/oauth";
import { setShopifyConnectingFlag } from "@/lib/integrations/shopify/session";

export async function GET(request: Request) {
  try {
    const env = getShopifyOAuthEnv();
    const { searchParams } = new URL(request.url);
    const shop = normalizeShopDomain(searchParams.get("shop") ?? "");

    if (!shop) {
      return NextResponse.redirect(
        new URL("/onboarding/store?shopify=error&reason=invalid_shop", request.url),
      );
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
    return NextResponse.redirect(
      new URL("/onboarding/store?shopify=error&reason=configuration", request.url),
    );
  }
}
