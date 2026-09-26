"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";
import { ComingSoonBadge } from "@/components/dashboard/coming-soon-badge";
import { Tooltip } from "@/components/ui/tooltip";
import {
  groupIsActive,
  itemIsActive,
  visibleSidebarGroups,
  type SidebarGroup,
} from "./sidebar-model";

interface DashboardSidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}

const STORAGE_KEY = "confirma-sidebar-groups";
const SCROLL_KEY = "confirma-sidebar-scroll";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      {children}
    </svg>
  );
}

const iconTone: Record<string, string> = {
  overview: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200",
  orders: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200",
  analytics: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  connections: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  tracking: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200",
  marketing: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200",
  wallet: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  team: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200",
  settings: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200",
};

const analyticsKeys = new Set(["overview", "orders", "analytics"]);

const comingSoonHrefs = new Set([
  "/dashboard/marketing",
  "/dashboard/marketing/campaigns",
  "/dashboard/marketing/audiences",
  "/dashboard/marketing/templates",
  "/dashboard/wallet/transactions",
  "/dashboard/wallet/invoices",
  "/dashboard/team",
]);

const icons: Record<string, ReactNode> = {
  overview: (
    <Icon>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="4" rx="1.5" />
      <rect x="13" y="10" width="7" height="10" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  orders: (
    <Icon>
      <path d="M7 7h10M7 12h10M7 17h6" />
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
    </Icon>
  ),
  analytics: (
    <Icon>
      <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
    </Icon>
  ),
  connections: (
    <Icon>
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="M9 11.2 15 8.2M9 12.8l6 3" />
    </Icon>
  ),
  tracking: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </Icon>
  ),
  marketing: (
    <Icon>
      <path d="M4 10v4l10 4V6L4 10zM14 9.5c1.5.8 2.5 1.8 2.5 2.5S15.5 13.7 14 14.5" />
    </Icon>
  ),
  wallet: (
    <Icon>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </Icon>
  ),
  team: (
    <Icon>
      <circle cx="9" cy="9" r="2.2" />
      <circle cx="16" cy="10" r="1.8" />
      <path d="M4.5 18c.8-2.4 2.6-3.5 4.5-3.5s3.7 1.1 4.5 3.5M14 14.6c.8-.4 1.7-.6 2.4-.6 1.4 0 2.7.7 3.4 2.4" />
    </Icon>
  ),
  admin: (
    <Icon>
      <path d="M12 3.5 18.5 6v5.2c0 3.6-2.4 6.4-6.5 8.3-4.1-1.9-6.5-4.7-6.5-8.3V6L12 3.5z" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
    </Icon>
  ),
};

function loadOpen(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function DashboardSidebar({
  mobileOpen,
  collapsed,
  isAdmin,
  onClose,
  onToggleCollapsed,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const t = useTranslations("navigation.sidebar");
  const brand = useTranslations("common");
  const groups = visibleSidebarGroups(isAdmin);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const hydrated = useRef(false);
  const desktopNavRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const saved = window.sessionStorage.getItem(SCROLL_KEY);
    const top = saved === null ? Number.NaN : Number(saved);
    if (!Number.isFinite(top)) {
      return;
    }
    if (desktopNavRef.current) {
      desktopNavRef.current.scrollTop = top;
    }
    if (mobileNavRef.current) {
      mobileNavRef.current.scrollTop = top;
    }
  }, [pathname]);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const stored = loadOpen();
    setOpen((current) => {
      const next = { ...stored, ...current };
      for (const group of visibleSidebarGroups(isAdmin)) {
        const active = groupIsActive(group, pathname);
        if (!hydrated.current && active && stored[group.key] === undefined) {
          next[group.key] = true;
        }
        if (hydrated.current && active) {
          next[group.key] = true;
        }
      }
      hydrated.current = true;
      return next;
    });
  }, [pathname, isAdmin]);

  function toggle(key: string) {
    setOpen((current) => {
      const next = { ...current, [key]: !current[key] };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function renderPanel(navRef: RefObject<HTMLElement | null>) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className={`flex items-center gap-2 p-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? null : (
            <Link href="/dashboard" prefetch className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {brand("brand")}
            </Link>
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
        <nav
          ref={navRef}
          onScroll={(event) => {
            window.sessionStorage.setItem(SCROLL_KEY, String(event.currentTarget.scrollTop));
          }}
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4"
        >
          <Link
            href="/dashboard/settings"
            prefetch
            className={`mb-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse-dot" />
            {collapsed ? <span className="sr-only">{t("support")}</span> : t("support")}
          </Link>
          {(["analytics", "setup"] as const).map((section) => {
            const sectionGroups = groups.filter((group) =>
              section === "analytics" ? analyticsKeys.has(group.key) : !analyticsKeys.has(group.key),
            );
            if (!sectionGroups.length) {
              return null;
            }
            return (
              <div key={section} className="mb-2">
                {collapsed ? null : (
                  <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    {t(section === "analytics" ? "groupAnalytics" : "groupSetup")}
                  </p>
                )}
                {sectionGroups.map((group) => (
                  <GroupRow
                    key={group.key}
                    group={group}
                    collapsed={collapsed}
                    expanded={group.items.length === 0 ? false : Boolean(open[group.key])}
                    pathname={pathname}
                    search={search}
                    label={t(group.key)}
                    onToggle={() => toggle(group.key)}
                    childLabel={(key) => t(key)}
                  />
                ))}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <UserMenu variant="card" menuSide="top" collapsed={collapsed} />
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        className={`hidden h-screen shrink-0 overflow-hidden border-e border-line bg-surface transition-[width] duration-200 lg:block ${
          collapsed ? "w-[4.75rem]" : "w-72"
        }`}
      >
        {renderPanel(desktopNavRef)}
      </aside>
      {mobileOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label={brand("closeMenu")}
            className="fixed inset-0 z-40 bg-slate-950/40"
            onClick={onClose}
          />
          <aside className="animate-drawer-start fixed inset-y-0 start-0 z-50 h-screen w-[min(100%,18rem)] overflow-hidden border-e border-line bg-surface shadow-large">
            {renderPanel(mobileNavRef)}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function GroupRow({
  group,
  collapsed,
  expanded,
  pathname,
  search,
  label,
  onToggle,
  childLabel,
}: {
  group: SidebarGroup;
  collapsed: boolean;
  expanded: boolean;
  pathname: string;
  search: string;
  label: string;
  onToggle: () => void;
  childLabel: (key: string) => string;
}) {
  const active = groupIsActive(group, pathname);
  const link = (
    <Link
      href={group.href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
        collapsed ? "justify-center" : ""
      } ${active ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface-muted hover:text-foreground"}`}
    >
      {active ? (
        <span aria-hidden className="absolute inset-y-2 start-0 w-1 rounded-full bg-white" />
      ) : null}
      <span
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-white/15 text-white" : iconTone[group.key] ?? iconTone.overview
        }`}
      >
        {icons[group.key]}
      </span>
      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
      {!collapsed && comingSoonHrefs.has(group.href) ? <ComingSoonBadge /> : null}
    </Link>
  );

  return (
    <div>
      <div className="flex items-center gap-1">
        {collapsed ? <Tooltip label={label}>{link}</Tooltip> : link}
        {!collapsed && group.items.length > 0 ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={label}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted"
            onClick={onToggle}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : null}
      </div>
      {!collapsed ? (
        <div className={`accordion-panel ${expanded ? "is-open" : ""}`}>
          <ul className="ms-4 space-y-1 border-s border-line py-1 ps-2">
            {group.items.map((item) => {
              const link =
                item.href === "/dashboard/tracking/gtm"
                  ? { labelKey: "googleAds", href: "/dashboard/tracking/google" }
                  : item;
              const childActive = itemIsActive(link.href, pathname, search);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch
                    aria-current={childActive ? "page" : undefined}
                    className={`tab-underline block rounded-lg px-3 py-2 text-sm ${
                      childActive ? "bg-indigo-50 font-medium text-primary dark:bg-indigo-950/60" : "text-muted hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {childLabel(link.labelKey)}
                      {comingSoonHrefs.has(link.href) ? <ComingSoonBadge /> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
