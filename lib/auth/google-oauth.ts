import { resolveSafeInternalRedirect } from "@/lib/auth/redirects";
import { buildAuthCallbackUrl } from "@/lib/config/app-url";

export const GOOGLE_OAUTH_PROVIDER = "google" as const;
export const GOOGLE_SIGNUP_DESTINATION = "/dashboard";

export type GoogleOAuthOrigin = "signup" | "login";

type GoogleOAuthRequest = {
  provider: typeof GOOGLE_OAUTH_PROVIDER;
  options: { redirectTo: string };
};

export function buildGoogleOAuthRedirectUrl(
  appUrl: string,
  next: string | null | undefined,
  fallback: string,
  origin: GoogleOAuthOrigin,
): string {
  const safeNext = resolveSafeInternalRedirect(next, fallback);
  const callback = new URL(buildAuthCallbackUrl(appUrl, safeNext));
  callback.searchParams.set("oauth", "google");
  callback.searchParams.set("from", origin);
  return callback.toString();
}

export async function requestGoogleOAuth(
  signIn: (request: GoogleOAuthRequest) => Promise<{ error: unknown }>,
  redirectTo: string,
): Promise<boolean> {
  const { error } = await signIn({
    provider: GOOGLE_OAUTH_PROVIDER,
    options: { redirectTo },
  });
  return !error;
}

export type AuthCallbackFailure = {
  path: "/login" | "/signup";
  error: "auth_required" | "google_cancelled" | "google_failed";
};

export function resolveAuthCallbackFailure(params: {
  oauth: string | null;
  from: string | null;
  error: string | null;
  exchangeFailed?: boolean;
}): AuthCallbackFailure {
  if (params.oauth !== "google") {
    return { path: "/login", error: "auth_required" };
  }

  const path = params.from === "signup" ? "/signup" : "/login";
  if (!params.exchangeFailed && params.error === "access_denied") {
    return { path, error: "google_cancelled" };
  }

  return { path, error: "google_failed" };
}
