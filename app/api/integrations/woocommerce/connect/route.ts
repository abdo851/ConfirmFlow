import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { buildAppPath } from "@/lib/config/app-url";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getLocalizedPath } from "@/lib/i18n/server-locale";
import {
  WOOCOMMERCE_CALLBACK_PATH,
  WOOCOMMERCE_DEFAULT_SCOPE,
  WOOCOMMERCE_OAUTH_STATE_COOKIE,
  WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS,
  WOOCOMMERCE_RETURN_PATH,
  buildAuthorizeUrl,
  getWooCommerceEnv,
  normalizeStoreUrl,
  signStoreUrl,
} from "@/lib/integrations/woocommerce";
import { resolveWooCommerceBrowserOrigin } from "@/lib/integrations/woocommerce/oauth/return-origin";

async function redirectToStoreError(
  reason: string,
  origin: string,
): Promise<NextResponse> {
  const errorPath = await getLocalizedPath(
    `/onboarding/store?woocommerce=error&reason=${reason}`,
  );
  return NextResponse.redirect(buildAppPath(origin, errorPath));
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getAppBaseUrl();
  const browserOrigin = resolveWooCommerceBrowserOrigin({
    requestUrl: request.url,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    appBaseUrl: baseUrl,
  });

  try {
    const env = getWooCommerceEnv();
    const { searchParams } = new URL(request.url);
    const storeUrl = normalizeStoreUrl(searchParams.get("store") ?? "");

    if (!storeUrl) {
      return redirectToStoreError("invalid_store", browserOrigin);
    }

    const state = signStoreUrl(
      storeUrl,
      env.WOOCOMMERCE_SESSION_SECRET,
      user.id,
    );
    const callbackUrl = new URL(WOOCOMMERCE_CALLBACK_PATH, `${baseUrl}/`);
    callbackUrl.searchParams.set("state", state);

    const authorizeUrl = buildAuthorizeUrl({
      store_url: storeUrl,
      user_id: user.id,
      return_url: buildAppPath(browserOrigin, WOOCOMMERCE_RETURN_PATH),
      callback_url: callbackUrl.toString(),
      app_name: env.WOOCOMMERCE_APP_NAME,
      scope: WOOCOMMERCE_DEFAULT_SCOPE,
    });

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(WOOCOMMERCE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS,
    });
    return response;
  } catch {
    return redirectToStoreError("invalid_state", browserOrigin);
  }
}
