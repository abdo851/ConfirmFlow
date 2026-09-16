import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { ReactNode } from "react";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const brand = await getTranslations("common");
  const nav = await getTranslations("navigation");

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {brand("brand")}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/dashboard"
              className="text-sm text-neutral-600 dark:text-neutral-400"
            >
              {nav("dashboard")}
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </div>
  );
}
