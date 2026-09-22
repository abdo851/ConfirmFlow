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
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-medium"
        onClick={() => void download()}
      >
        {t("exportCsv")}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-700">{t("exportFailed")}</p> : null}
    </div>
  );
}
