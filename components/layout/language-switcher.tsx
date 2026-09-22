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
    <label className="inline-flex min-h-11 items-center gap-2 text-sm">
      <span className="sr-only">{t("switchLabel")}</span>
      <select
        aria-label={t("switchLabel")}
        className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-foreground shadow-soft outline-none focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ring)_28%,transparent)]"
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
