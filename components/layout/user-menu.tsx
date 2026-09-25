"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth/actions";
import type { AppLocale } from "@/lib/i18n/locales";
import { applyTheme, readThemeChoice, type ThemeChoice } from "@/components/theme/theme-watcher";

interface UserMenuProps {
  unreadCount?: number;
  menuSide?: "top" | "bottom";
  variant?: "avatar" | "card";
  collapsed?: boolean;
}

export function UserMenu({
  unreadCount = 0,
  menuSide = "bottom",
  variant = "avatar",
  collapsed = false,
}: UserMenuProps) {
  const t = useTranslations("navigation.userMenu");
  const brand = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("system");

  useEffect(() => {
    setTheme(readThemeChoice());
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function place() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const width = 256;
      const height = 420;
      const margin = 8;
      const rtl = document.documentElement.dir === "rtl";
      const rawLeft = rtl ? rect.left : rect.right - width;
      const left = Math.min(Math.max(margin, rawLeft), window.innerWidth - width - margin);
      const openAbove = menuSide === "top" || rect.bottom + height > window.innerHeight;
      const top = openAbove ? Math.max(margin, rect.top - height - margin) : rect.bottom + margin;
      setMenuStyle({ top, left });
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setLangOpen(false);
      setThemeOpen(false);
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setLangOpen(false);
        setThemeOpen(false);
      }
    }

    function onScroll() {
      setOpen(false);
    }

    place();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, menuSide]);

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  function switchLocale(next: AppLocale) {
    router.replace(pathname, { locale: next });
    setOpen(false);
  }

  function chooseTheme(next: ThemeChoice) {
    applyTheme(next);
    setTheme(next);
  }

  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-start text-sm font-medium text-foreground hover:bg-surface-muted";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={
          variant === "card"
            ? `group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-surface-muted ${collapsed ? "justify-center" : ""}`
            : "group inline-flex min-h-11 items-center gap-1 rounded-full py-1 ps-1 pe-2 hover:bg-surface-muted"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("open")}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          C
        </span>
        {variant === "card" && !collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{brand("account")}</span>
            <span className="block truncate text-xs text-muted">{t("open")}</span>
          </span>
        ) : null}
        {variant === "avatar" || !collapsed ? <Chevron open={open} /> : null}
      </button>
      {open && menuStyle
        ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("open")}
          onKeyDown={onMenuKeyDown}
          style={{ top: menuStyle.top, left: menuStyle.left }}
          className="fixed z-[80] max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-large"
        >
          <Link href="/dashboard/settings/account" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <MenuIcon path="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" />
            {t("account")}
          </Link>
          <Link href="/dashboard/settings/account" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <MenuIcon path="M4 6h16M4 12h16M4 18h10" />
            {t("profile")}
          </Link>
          <Link href="/dashboard/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <MenuIcon path="M12 8.5a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 8.5zM5 12h2M17 12h2M12 5v2M12 17v2" />
            {t("settings")}
          </Link>
          <Link href="/dashboard/settings/notifications" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <MenuIcon path="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5zM10 19a2 2 0 0 0 4 0" />
            <span className="inline-flex items-center gap-2">
              {t("notifications")}
              {unreadCount > 0 ? <span aria-hidden className="size-2 rounded-full bg-rose-600" /> : null}
            </span>
          </Link>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            aria-expanded={themeOpen}
            onClick={() => setThemeOpen((current) => !current)}
          >
            <MenuIcon path="M12 3v2M12 19v2M4.2 6.2l1.4 1.4M18.4 16.4l1.4 1.4M3 12h2M19 12h2M4.2 17.8l1.4-1.4M18.4 7.6l1.4-1.4" />
            {t("theme")}
          </button>
          {themeOpen ? (
            <div className="ms-8 grid gap-1">
              {(["light", "dark", "system"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => chooseTheme(choice)}
                >
                  {theme === choice ? "• " : ""}
                  {t(choice === "light" ? "themeLight" : choice === "dark" ? "themeDark" : "themeSystem")}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" role="menuitem" className={itemClass} aria-expanded={langOpen} onClick={() => setLangOpen((current) => !current)}>
            <MenuIcon path="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
            {t("language")}
          </button>
          {langOpen ? (
            <div className="ms-8 grid gap-1">
              <button type="button" role="menuitem" className={itemClass} onClick={() => switchLocale("ar")}>
                {locale === "ar" ? "• " : ""}العربية
              </button>
              <button type="button" role="menuitem" className={itemClass} onClick={() => switchLocale("en")}>
                {locale === "en" ? "• " : ""}English
              </button>
            </div>
          ) : null}
          <div className="my-1 border-t border-line" />
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className={`${itemClass} text-rose-600`}>
              <MenuIcon path="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M4 12h11M12 8l4 4-4 4" />
              {t("logout")}
            </button>
          </form>
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-4 shrink-0 text-muted transition-transform duration-150 group-hover:rotate-12 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-indigo-600" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={path} />
    </svg>
  );
}
