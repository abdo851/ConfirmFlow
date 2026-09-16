"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";

export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("navigation");
  const brand = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            {brand("brand")}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/" className="text-sm text-neutral-600 dark:text-neutral-400">
              {brand("home")}
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                {t("signOut")}
              </Button>
            </form>
          </div>
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
        <DashboardSidebar />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
