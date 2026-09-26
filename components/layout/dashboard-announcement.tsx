"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function DashboardAnnouncement() {
  const t = useTranslations("dashboard.announcement");
  const text = t("text");
  const [hidden, setHidden] = useState(false);

  if (!text || hidden) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-600 text-white">
      <div className="marquee min-w-0 flex-1 overflow-hidden py-1.5">
        <div className="marquee-track">
          <span className="px-8 text-sm">{text}</span>
          <span className="px-8 text-sm" aria-hidden>
            {text}
          </span>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center text-lg"
        aria-label={t("dismiss")}
        onClick={() => setHidden(true)}
      >
        ×
      </button>
    </div>
  );
}
