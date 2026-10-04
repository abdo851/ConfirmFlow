"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINKS = {
  localization: "/dashboard/settings/language",
  notifications: "/dashboard/settings/notifications",
} as const;

export function DashboardAnnouncement() {
  const t = useTranslations("dashboard.advancedSettings");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-3 text-sm font-medium"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        {t("label")}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="absolute end-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-3 shadow-medium"
        >
          <p id={titleId} className="px-2 py-1 text-sm font-semibold">
            {t("title")}
          </p>
          <div className="mt-1 grid gap-1">
            <Category title={t("interface")} body={t("interfaceBody")} />
            <Category title={t("display")} body={t("displayBody")} />
            <Category title={t("localization")} body={t("localizationBody")} href={LINKS.localization} />
            <Category title={t("notifications")} body={t("notificationsBody")} href={LINKS.notifications} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Category({ title, body, href }: { title: string; body: string; href?: string }) {
  const className = "block rounded-xl px-2 py-2 text-start";
  const content = (
    <>
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-0.5 block text-xs leading-5 text-muted">{body}</span>
    </>
  );
  if (!href) {
    return <div className={className}>{content}</div>;
  }
  return (
    <Link href={href} className={`${className} hover:bg-surface-muted`}>
      {content}
    </Link>
  );
}
