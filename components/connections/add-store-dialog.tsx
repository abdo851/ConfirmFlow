"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function AddStoreDialog() {
  const t = useTranslations("dashboard");
  const connections = useTranslations("connections");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
        onClick={() => setOpen(true)}
      >
        {t("addStore")}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-large"
          >
            <h2 id={titleId} className="text-lg font-semibold">
              {t("addStoreTitle")}
            </h2>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="flex min-h-11 items-center justify-between rounded-xl border border-line px-3 text-start text-sm font-medium hover:bg-surface-muted"
                onClick={() => router.push("/onboarding/store?add=new")}
              >
                WooCommerce
              </button>
              <button
                type="button"
                disabled
                className="flex min-h-11 items-center justify-between rounded-xl border border-line px-3 text-start text-sm text-muted"
              >
                <span>YouCan</span>
                <span className="text-xs font-semibold">{connections("comingSoon")}</span>
              </button>
              <button
                type="button"
                disabled
                className="flex min-h-11 items-center justify-between rounded-xl border border-line px-3 text-start text-sm text-muted"
              >
                <span>Shopify</span>
                <span className="text-xs font-semibold">{connections("comingSoon")}</span>
              </button>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center text-sm text-muted"
              onClick={() => setOpen(false)}
            >
              {t("videoDismiss")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
