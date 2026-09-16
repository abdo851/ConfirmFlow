"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader() {
  const t = useTranslations("navigation");
  const brand = useTranslations("common");

  return (
    <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {brand("brand")}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="outline" href="/login">
            {t("signIn")}
          </Button>
          <Button href="/signup">{t("getStarted")}</Button>
        </div>
      </nav>
    </header>
  );
}
