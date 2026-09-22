import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";

export async function RecentEventsPlaceholder() {
  const t = await getTranslations("dashboard");

  return (
    <Card
      title={t("recentEventsTitle")}
      description={t("recentEventsDescription")}
      interactive
    >
      <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <svg viewBox="0 0 120 72" className="mx-auto mb-4 h-16 w-28 text-muted" aria-hidden>
          <rect x="8" y="12" width="104" height="48" rx="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M24 36h40M24 46h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="88" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="text-sm font-medium">{t("recentEventsEmpty")}</p>
      </div>
    </Card>
  );
}
