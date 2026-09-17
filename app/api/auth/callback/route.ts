import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { localeCookieName } from "@/i18n/routing";
import { resolveSafeInternalRedirect } from "@/lib/auth/redirects";
import { getAppBaseUrl } from "@/lib/config/urls";
import { isAppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildLocalizedRedirect(path: string, query?: string) {
  const baseUrl = getAppBaseUrl();
  const localizedPath = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  return query ? `${localizedPath}?${query}` : localizedPath;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = resolveSafeInternalRedirect(
    requestUrl.searchParams.get("next"),
    "/onboarding",
  );

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale =
    cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : "en";

  if (!code) {
    return NextResponse.redirect(
      buildLocalizedRedirect(withLocalePath(locale, "/login"), "error=auth_required"),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      buildLocalizedRedirect(withLocalePath(locale, "/login"), "error=auth_required"),
    );
  }

  return NextResponse.redirect(
    buildLocalizedRedirect(withLocalePath(locale, next)),
  );
}
