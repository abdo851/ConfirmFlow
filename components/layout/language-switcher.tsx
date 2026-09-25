"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  function choose(next: AppLocale) {
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
  }

  const optionClass = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm ${
      active ? "bg-surface font-medium text-foreground shadow-soft" : "text-muted hover:text-foreground"
    }`;

  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface-muted p-0.5" role="group" aria-label={t("switchLabel")}>
      <button type="button" className={optionClass(locale === "en")} aria-pressed={locale === "en"} onClick={() => choose("en")}>
        <span aria-hidden>🇬🇧</span>
        {t("english")}
      </button>
      <button type="button" className={optionClass(locale === "ar")} aria-pressed={locale === "ar"} onClick={() => choose("ar")}>
        <span aria-hidden>🇲🇦</span>
        {t("arabic")}
      </button>
    </div>
  );
}
