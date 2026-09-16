import "server-only";

import { cookies } from "next/headers";
import { defaultLocale, localeCookieName } from "@/i18n/routing";
import { isAppLocale, type AppLocale } from "./locales";
import { withLocalePath } from "./paths";

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookieName)?.value;
  return value && isAppLocale(value) ? value : defaultLocale;
}

export async function getLocalizedPath(pathname: string): Promise<string> {
  const locale = await getServerLocale();
  return withLocalePath(locale, pathname);
}
