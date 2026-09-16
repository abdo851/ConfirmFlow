import { defaultLocale, isAppLocale, type AppLocale } from "./locales";

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && isAppLocale(maybeLocale)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname || "/";
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && isAppLocale(maybeLocale)) {
    return maybeLocale;
  }

  return defaultLocale;
}

export function withLocalePath(locale: AppLocale, pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const stripped = stripLocalePrefix(normalized);
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}
