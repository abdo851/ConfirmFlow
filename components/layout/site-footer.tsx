"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 rtl:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SiteFooter() {
  const landing = useTranslations("landing");
  const nav = useTranslations("navigation");
  const brand = useTranslations("common");

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-base font-semibold">{brand("brand")}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{landing("footer")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{landing("footerProduct")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href="#how-it-works" className="hover:text-foreground">
                {landing("howItWorks")}
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-foreground">
                {landing("stepsTitle")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{landing("footerAccount")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/login" className="hover:text-foreground">
                {nav("signIn")}
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-foreground">
                {nav("getStarted")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted">{landing("footer")}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                aria-label={brand("home")}
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-muted hover:text-foreground"
              >
                <IconHome />
              </Link>
              <Link
                href="/login"
                aria-label={nav("signIn")}
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-muted hover:text-foreground"
              >
                <IconUser />
              </Link>
              <Link
                href="/signup"
                aria-label={nav("getStarted")}
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-muted hover:text-foreground"
              >
                <IconArrow />
              </Link>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
