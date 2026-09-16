import {
  defaultLocale,
  locales,
  type AppLocale,
} from "@/i18n/routing";

export { defaultLocale, locales, type AppLocale };

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleDirection(locale: AppLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
