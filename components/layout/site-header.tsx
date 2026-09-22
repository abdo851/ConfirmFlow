"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader() {
  const t = useTranslations("navigation");
  const landing = useTranslations("landing");
  const brand = useTranslations("common");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const links = [
    { href: "#how-it-works", label: landing("howItWorks") },
    { href: "#features", label: landing("stepsTitle") },
    { href: "#proof", label: landing("proofTitle") },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-shadow duration-200 ${
        scrolled ? "shadow-medium" : "shadow-none"
      } border-line/80 bg-white/75 backdrop-blur-xl dark:bg-slate-950/70`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">
            {brand("brand")}
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <Button variant="ghost" href="/login">
            {t("signIn")}
          </Button>
          <Button href="/signup">{t("getStarted")}</Button>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface lg:hidden"
          aria-expanded={open}
          aria-label={open ? brand("closeMenu") : brand("openMenu")}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">
            {open ? brand("closeMenu") : brand("openMenu")}
          </span>
          <span aria-hidden className="flex w-4 flex-col gap-1">
            <span className="h-0.5 rounded-full bg-foreground" />
            <span className="h-0.5 rounded-full bg-foreground" />
            <span className="h-0.5 rounded-full bg-foreground" />
          </span>
        </button>
      </nav>

      {open ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label={brand("closeMenu")}
            className="fixed inset-0 top-16 z-40 bg-slate-950/40"
            onClick={() => setOpen(false)}
          />
          <div className="animate-drawer-end fixed inset-y-0 end-0 z-50 flex w-[min(100%,20rem)] flex-col gap-4 border-s border-line bg-surface p-4 shadow-large">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <LanguageSwitcher />
            <Button variant="outline" href="/login" className="w-full">
              {t("signIn")}
            </Button>
            <Button href="/signup" className="w-full">
              {t("getStarted")}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
