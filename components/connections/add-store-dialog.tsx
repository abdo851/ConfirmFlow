"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { STORES_PER_PROVIDER_LIMIT } from "@/lib/connections/store-limit";

export interface AddStoreCounts {
  youcan: number;
  woocommerce: number;
  shopify: number;
}

const BRANDS = {
  youcan: "/brands/youcan.svg",
  woocommerce: "/brands/woocommerce.svg",
  shopify: "/brands/shopify.svg",
} as const;

export function AddStoreDialog({ counts }: { counts: AddStoreCounts }) {
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

  function usage(count: number, blocked: boolean) {
    if (blocked && count >= STORES_PER_PROVIDER_LIMIT) {
      return t("storeLimitReached");
    }
    if (blocked) {
      return connections("comingSoon");
    }
    if (count <= 0) {
      return null;
    }
    if (count >= STORES_PER_PROVIDER_LIMIT) {
      return t("storeLimitReached");
    }
    return t("storeCountHint", { count });
  }

  const rows = [
    {
      id: "woocommerce" as const,
      label: "WooCommerce",
      href: "/onboarding/store?provider=woocommerce",
      blocked: counts.woocommerce >= STORES_PER_PROVIDER_LIMIT,
    },
    {
      id: "youcan" as const,
      label: "YouCan",
      href: "/onboarding/store?provider=youcan",
      blocked: counts.youcan >= STORES_PER_PROVIDER_LIMIT,
    },
    {
      id: "shopify" as const,
      label: "Shopify",
      href: "/onboarding/store?provider=shopify",
      blocked: true,
    },
  ];

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
              {rows.map((row) => {
                const hint = usage(counts[row.id], row.blocked);
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={row.blocked}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-start text-sm font-medium enabled:hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
                    onClick={() => router.push(row.href)}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="size-8 shrink-0 rounded-lg bg-surface-muted bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${BRANDS[row.id]})` }}
                      />
                      <span>
                        <span className="block">{row.label}</span>
                        {hint && !row.blocked ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted">
                            {hint}
                            <span className="ms-2">{t("storeCountBadge", { count: counts[row.id] })}</span>
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {row.blocked ? (
                      <span className="text-xs font-semibold">{hint}</span>
                    ) : null}
                  </button>
                );
              })}
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
