import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, localeCookieName } from "@/i18n/routing";
import {
  isProtectedAppPath,
  isProtectedMetaApiPath,
  isProtectedShopifyApiPath,
  isProtectedYouCanApiPath,
} from "@/lib/auth/protection";
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/locales";
import { getLocaleFromPathname, withLocalePath } from "@/lib/i18n/paths";

const handleI18nRouting = createIntlMiddleware(routing);

function getRequestLocale(request: NextRequest) {
  const fromPath = getLocaleFromPathname(request.nextUrl.pathname);
  if (fromPath !== defaultLocale || request.nextUrl.pathname.startsWith(`/${defaultLocale}`)) {
    return fromPath;
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  return cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

async function applySupabaseSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function isWooCommercePublicPath(pathname: string): boolean {
  return (
    pathname === "/api/integrations/woocommerce/callback" ||
    pathname === "/api/integrations/woocommerce/webhooks"
  );
}

function isProtectedWooCommerceApiPath(pathname: string): boolean {
  if (isWooCommercePublicPath(pathname)) {
    return false;
  }

  return pathname.startsWith("/api/integrations/woocommerce");
}

/** Path + query for post-login redirect (e.g. connect routes with ?shop=). */
function buildLoginNextPath(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;
  return `${pathname}${search}`;
}

function redirectUnauthenticatedToLogin(
  request: NextRequest,
  locale: AppLocale,
): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = withLocalePath(locale, "/login");
  loginUrl.search = "";
  loginUrl.searchParams.set("next", buildLoginNextPath(request));
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const response = NextResponse.next({ request });
    const user = await applySupabaseSession(request, response);

    if (isProtectedShopifyApiPath(pathname) && !user) {
      if (pathname.endsWith("/connect") || pathname.endsWith("/callback")) {
        return redirectUnauthenticatedToLogin(request, getRequestLocale(request));
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isProtectedYouCanApiPath(pathname) && !user) {
      if (pathname.endsWith("/connect") || pathname.endsWith("/callback")) {
        return redirectUnauthenticatedToLogin(request, getRequestLocale(request));
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isProtectedWooCommerceApiPath(pathname) && !user) {
      if (pathname.endsWith("/connect")) {
        return redirectUnauthenticatedToLogin(request, getRequestLocale(request));
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isProtectedMetaApiPath(pathname) && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return response;
  }

  const response = handleI18nRouting(request);
  const user = await applySupabaseSession(request, response);

  if (isProtectedAppPath(pathname) && !user) {
    return redirectUnauthenticatedToLogin(request, getRequestLocale(request));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
