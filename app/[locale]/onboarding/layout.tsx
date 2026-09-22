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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-line bg-white/75 backdrop-blur-xl dark:bg-slate-950/70">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              C
            </span>
            {brand("brand")}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted"
            >
              {nav("dashboard")}
            </Link>
          </div>
        </nav>
      </header>
      <main className="animate-fade-in mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
