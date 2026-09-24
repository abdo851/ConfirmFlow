"use client";

import { useTranslations } from "next-intl";
import { Tooltip } from "@/components/ui/tooltip";

export function ComingSoonBadge() {
  const t = useTranslations("dashboard.pages");

  return (
    <Tooltip label={t("comingSoonHint")}>
      <span className="inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-rose-700 dark:bg-rose-950/60 dark:text-rose-200">
        {t("comingSoonShort")}
      </span>
    </Tooltip>
  );
}
