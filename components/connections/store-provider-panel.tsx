"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { YouCanConnectForm } from "./youcan-connect-form";

function StoreProviderLoading() {
  const t = useTranslations("connections");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 text-sm dark:border-neutral-800">
      {t("loadingYouCan")}
    </div>
  );
}

export function StoreProviderPanel() {
  return (
    <Suspense fallback={<StoreProviderLoading />}>
      <YouCanConnectForm />
    </Suspense>
  );
}
