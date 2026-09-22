"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}

function IconOverview() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="4" rx="1.5" />
      <rect x="13" y="10" width="7" height="10" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 7h10M7 12h10M7 17h6" />
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
    </svg>
  );
}

function IconConnections() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="M9 11.2 15 8.2M9 12.8l6 3" />
    </svg>
  );
}

function IconSetup() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const icons: Record<string, ReactNode> = {
  "/dashboard": <IconOverview />,
  "/dashboard/orders": <IconOrders />,
  "/dashboard/connections": <IconConnections />,
  "/onboarding": <IconSetup />,
};

export function DashboardSidebar({
  mobileOpen,
  collapsed,
  onClose,
  onToggleCollapsed,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const brand = useTranslations("common");

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const navItems = [
    { label: t("overview"), href: "/dashboard" as const },
    { label: t("orders"), href: "/dashboard/orders" as const },
    { label: t("connections"), href: "/dashboard/connections" as const },
    { label: t("onboarding"), href: "/onboarding" as const },
  ];

  function Panel() {
    return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-2 p-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        {collapsed ? null : (
          <p className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {brand("brand")}
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-muted lg:inline-flex"
          aria-label={collapsed ? brand("expandSidebar") : brand("collapseSidebar")}
        >
          <span aria-hidden className={collapsed ? "rtl:rotate-180" : "rotate-180 rtl:rotate-0"}>
            ‹
          </span>
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const link = (
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-indigo-50 text-primary dark:bg-indigo-950/60"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute inset-y-2 start-0 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-teal-400"
                />
              ) : null}
              {icons[item.href]}
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </Link>
          );

          return (
            <div key={item.href}>
              {collapsed ? <Tooltip label={item.label}>{link}</Tooltip> : link}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <div className={`mb-2 flex items-center gap-3 rounded-xl px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            C
          </span>
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{brand("account")}</p>
              <p className="truncate text-xs text-muted">{brand("brand")}</p>
            </div>
          )}
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className={collapsed ? "w-11 px-0" : "w-full justify-start"}
          >
            {collapsed ? <span className="sr-only">{t("signOut")}</span> : t("signOut")}
            {collapsed ? <span aria-hidden>↪</span> : null}
          </Button>
        </form>
      </div>
    </div>
    );
  }

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-e border-line bg-surface transition-[width] duration-200 lg:block ${
          collapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <Panel />
      </aside>

      {mobileOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label={brand("closeMenu")}
            className="fixed inset-0 z-40 bg-slate-950/40"
            onClick={onClose}
          />
          <aside className="animate-drawer-start fixed inset-y-0 start-0 z-50 w-[min(100%,18rem)] border-e border-line bg-surface shadow-large">
            <Panel />
          </aside>
        </div>
      ) : null}
    </>
  );
}
