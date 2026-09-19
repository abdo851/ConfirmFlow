import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import { getShopifyOAuthEnv } from "@/lib/integrations/shopify/env";
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  SHOPIFY_OAUTH_STATE_TTL_SECONDS,
  handleShopifyOAuthCallback,
  parseOAuthState,
} from "@/lib/integrations/shopify/oauth";
import { shopifyAdapter } from "@/integrations/stores/shopify";
import {
  ShopifyPersistenceError,
  persistShopifyConnectionForUser,
} from "@/lib/integrations/shopify/persistence";
import { ShopifyWebhookRegistrationError } from "@/lib/integrations/shopify/webhooks/register";
import {
  clearLegacyShopifyConnectionCookie,
  clearShopifyConnectingFlag,
} from "@/lib/integrations/shopify/session";

async function redirectWithCleanup(path: string): Promise<NextResponse> {
  const localizedPath = await getLocalizedPath(path);
  const response = NextResponse.redirect(
    buildAppPath(getAppBaseUrl(), localizedPath),
  );
  response.cookies.delete(SHOPIFY_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirectWithCleanup("/login?error=auth_required");
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
        `/onboarding/store?shopify=error&reason=${result.reason}`,
      );
    }

    const { storeId } = await persistShopifyConnectionForUser({
      userId: user.id,
      userEmail: user.email ?? "",
      shop: result.shop,
      accessToken: result.accessToken,
      scope: result.scope,
    });

    await clearLegacyShopifyConnectionCookie();

    try {
      await shopifyAdapter.registerWebhooks(storeId);
    } catch (registrationError) {
      if (registrationError instanceof ShopifyWebhookRegistrationError) {
        return redirectWithCleanup(
          "/onboarding/store?shopify=error&reason=webhook_registration_failed",
        );
      }

      throw registrationError;
    }

    return redirectWithCleanup("/onboarding/store?shopify=connected");
  } catch (error) {
    await clearShopifyConnectingFlag();

    if (error instanceof ShopifyPersistenceError) {
      return redirectWithCleanup(
        "/onboarding/store?shopify=error&reason=persistence_failed",
      );
    }

    if (error instanceof ShopifyWebhookRegistrationError) {
      return redirectWithCleanup(
        "/onboarding/store?shopify=error&reason=webhook_registration_failed",
      );
    }

    return redirectWithCleanup(
      "/onboarding/store?shopify=error&reason=configuration",
    );
  }
}
