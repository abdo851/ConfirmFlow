"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ExportOrdersButton() {
  const t = useTranslations("orders");
  const [error, setError] = useState(false);

  async function download() {
    setError(false);
    const response = await fetch("/api/orders/export", { method: "POST" });
    if (!response.ok) {
      setError(true);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sm:text-end">
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700"
        onClick={() => void download()}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 4v10" strokeLinecap="round" />
          <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" strokeLinecap="round" />
        </svg>
        <span className="flex flex-col items-start leading-tight">
          <span>{t("exportCsv")}</span>
          <span className="text-[11px] font-medium text-emerald-50">{t("downloadReport")}</span>
        </span>
      </button>
      {error ? <p className="mt-2 text-xs text-rose-700">{t("exportFailed")}</p> : null}
    </div>
  );
}
