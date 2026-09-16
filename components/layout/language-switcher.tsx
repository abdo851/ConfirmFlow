"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{t("switchLabel")}</span>
      <select
        aria-label={t("switchLabel")}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        value={locale}
        onChange={(event) => {
          router.replace(pathname, { locale: event.target.value as AppLocale });
        }}
      >
        <option value="en">{t("english")}</option>
        <option value="ar">{t("arabic")}</option>
      </select>
    </label>
  );
}
