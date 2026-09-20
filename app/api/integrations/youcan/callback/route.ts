import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import {
  getYouCanOAuthEnv,
  getYouCanRedirectUri,
} from "@/lib/integrations/youcan/env";
import {
  YOUCAN_OAUTH_STATE_COOKIE,
  YOUCAN_OAUTH_STATE_TTL_SECONDS,
  handleYouCanOAuthCallback,
  parseOAuthState,
} from "@/lib/integrations/youcan/oauth";
import { youcanAdapter } from "@/integrations/stores/youcan";
import {
  YouCanPersistenceError,
  persistYouCanConnectionForUser,
} from "@/lib/integrations/youcan/persistence";
import { clearYouCanConnectingFlag } from "@/lib/integrations/youcan/session";
import { fetchYouCanStoreDetails } from "@/lib/integrations/youcan/store/fetch-details";
import { YouCanWebhookRegistrationError } from "@/lib/integrations/youcan/webhooks/register";

async function redirectWithCleanup(path: string): Promise<NextResponse> {
  const localizedPath = await getLocalizedPath(path);
  const response = NextResponse.redirect(
    buildAppPath(getAppBaseUrl(), localizedPath),
  );
  response.cookies.delete(YOUCAN_OAUTH_STATE_COOKIE);
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
    const env = getYouCanOAuthEnv();
    const cookieStore = await cookies();
    const stateFromCookie =
      cookieStore.get(YOUCAN_OAUTH_STATE_COOKIE)?.value ?? null;
    const stateFromQuery = query.state ?? null;

    if (
      !stateFromCookie ||
      !stateFromQuery ||
      stateFromCookie !== stateFromQuery
    ) {
      await clearYouCanConnectingFlag();
      return redirectWithCleanup(
        "/onboarding/store?youcan=error&reason=invalid_state",
      );
    }

    const expectedState = parseOAuthState(
      stateFromQuery,
      env.YOUCAN_SESSION_SECRET,
      YOUCAN_OAUTH_STATE_TTL_SECONDS * 1000,
    );

    if (!expectedState) {
      await clearYouCanConnectingFlag();
      return redirectWithCleanup(
        "/onboarding/store?youcan=error&reason=invalid_state",
      );
    }

    const result = await handleYouCanOAuthCallback({
      query,
      expectedState,
      clientId: env.YOUCAN_API_KEY,
      clientSecret: env.YOUCAN_API_SECRET,
      redirectUri: getYouCanRedirectUri(),
    });

    await clearYouCanConnectingFlag();

    if (!result.ok) {
      return redirectWithCleanup(
        `/onboarding/store?youcan=error&reason=${result.reason}`,
      );
    }

    const storeDetails = await fetchYouCanStoreDetails(result.accessToken);

    if (storeDetails && storeDetails.slug !== result.storeSlug) {
      return redirectWithCleanup(
        "/onboarding/store?youcan=error&reason=store_slug_mismatch",
      );
    }

    const { storeId } = await persistYouCanConnectionForUser({
      userId: user.id,
      userEmail: user.email ?? "",
      storeSlug: storeDetails?.slug ?? result.storeSlug,
      youcanStoreId: storeDetails?.storeId ?? null,
      storeName: storeDetails?.name,
      accessToken: result.accessToken,
      scope: result.scope,
    });

    try {
      await youcanAdapter.registerWebhooks(storeId);
    } catch (registrationError) {
      if (registrationError instanceof YouCanWebhookRegistrationError) {
        return redirectWithCleanup(
          "/onboarding/store?youcan=error&reason=webhook_registration_failed",
        );
      }

      throw registrationError;
    }

    return redirectWithCleanup("/onboarding/store?youcan=connected");
  } catch (error) {
    await clearYouCanConnectingFlag();

    if (error instanceof YouCanPersistenceError) {
      return redirectWithCleanup(
        "/onboarding/store?youcan=error&reason=persistence_failed",
      );
    }

    if (error instanceof YouCanWebhookRegistrationError) {
      return redirectWithCleanup(
        "/onboarding/store?youcan=error&reason=webhook_registration_failed",
      );
    }

    return redirectWithCleanup(
      "/onboarding/store?youcan=error&reason=configuration",
    );
  }
}
