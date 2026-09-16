import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getShopifyOAuthEnv } from "@/lib/integrations/shopify/env";
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  SHOPIFY_OAUTH_STATE_TTL_SECONDS,
  handleShopifyOAuthCallback,
  parseOAuthState,
} from "@/lib/integrations/shopify/oauth";
import {
  ShopifyPersistenceError,
  persistShopifyConnectionForUser,
} from "@/lib/integrations/shopify/persistence";
import {
  clearLegacyShopifyConnectionCookie,
  clearShopifyConnectingFlag,
} from "@/lib/integrations/shopify/session";

function redirectWithCleanup(
  request: Request,
  path: string,
): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(SHOPIFY_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirectWithCleanup(request, "/login?error=auth_required");
  }

  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const env = getShopifyOAuthEnv();
    const cookieStore = await cookies();
    const stateFromCookie =
      cookieStore.get(SHOPIFY_OAUTH_STATE_COOKIE)?.value ?? null;
    const stateFromQuery = query.state ?? null;

    if (
      !stateFromCookie ||
      !stateFromQuery ||
      stateFromCookie !== stateFromQuery
    ) {
      await clearShopifyConnectingFlag();
      return redirectWithCleanup(
        request,
        "/onboarding/store?shopify=error&reason=invalid_state",
      );
    }

    const expectedState = parseOAuthState(
      stateFromQuery,
      env.SHOPIFY_SESSION_SECRET,
      SHOPIFY_OAUTH_STATE_TTL_SECONDS * 1000,
    );

    if (!expectedState) {
      await clearShopifyConnectingFlag();
      return redirectWithCleanup(
        request,
        "/onboarding/store?shopify=error&reason=invalid_state",
      );
    }

    const result = await handleShopifyOAuthCallback({
      query,
      expectedState,
      clientId: env.SHOPIFY_API_KEY,
      clientSecret: env.SHOPIFY_API_SECRET,
    });

    await clearShopifyConnectingFlag();

    if (!result.ok) {
      return redirectWithCleanup(
        request,
        `/onboarding/store?shopify=error&reason=${result.reason}`,
      );
    }

    await persistShopifyConnectionForUser({
      userId: user.id,
      userEmail: user.email ?? "",
      shop: result.shop,
      accessToken: result.accessToken,
      scope: result.scope,
    });

    await clearLegacyShopifyConnectionCookie();

    return redirectWithCleanup(
      request,
      "/onboarding/store?shopify=connected",
    );
  } catch (error) {
    await clearShopifyConnectingFlag();

    if (error instanceof ShopifyPersistenceError) {
      return redirectWithCleanup(
        request,
        "/onboarding/store?shopify=error&reason=persistence_failed",
      );
    }

    return redirectWithCleanup(
      request,
      "/onboarding/store?shopify=error&reason=configuration",
    );
  }
}
