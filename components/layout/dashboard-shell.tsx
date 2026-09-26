"use client";

import { Suspense, useCallback, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "./user-menu";
import { LanguageSwitcher } from "./language-switcher";
import { DashboardAnnouncement } from "./dashboard-announcement";

export function DashboardShell({
  children,
  isAdmin,
}: {
  children: ReactNode;
  isAdmin: boolean;
}) {
  const brand = useTranslations("common");
  const rootNav = useTranslations("navigation");
  const nav = useTranslations("navigation.sidebar");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const titleKey = (
    [
      ["/dashboard/orders", "orders"],
      ["/dashboard/analytics", "analytics"],
      ["/dashboard/connections", "connections"],
      ["/dashboard/tracking", "tracking"],
      ["/dashboard/marketing", "marketing"],
      ["/dashboard/wallet", "wallet"],
      ["/dashboard/team", "team"],
      ["/dashboard/admin", "admin"],
      ["/dashboard/settings", "settings"],
    ] as const
  ).find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
  const pageTitle = titleKey ? nav(titleKey) : brand("brand");

  return (
    <div className="h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
      <Suspense fallback={null}>
        <DashboardSidebar
          mobileOpen={mobileOpen}
          collapsed={collapsed}
          isAdmin={isAdmin}
          onClose={closeMobile}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />
      </Suspense>
      <div className="flex h-screen min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="z-30 shrink-0 border-b border-line bg-white/95 dark:bg-slate-950/95">
          <DashboardAnnouncement />
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface lg:hidden"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? brand("closeMenu") : brand("openMenu")}
                onClick={() => setMobileOpen((current) => !current)}
              >
                <span aria-hidden className="flex w-4 flex-col gap-1">
                  <span className="h-0.5 rounded-full bg-foreground" />
                  <span className="h-0.5 rounded-full bg-foreground" />
                  <span className="h-0.5 rounded-full bg-foreground" />
                </span>
              </button>
              <p className="min-w-0 truncate text-sm font-semibold tracking-tight sm:text-base">{pageTitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <Link href="/dashboard" prefetch className="hidden min-h-11 items-center text-sm text-muted sm:inline-flex">
                {rootNav("dashboard")}
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
