import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";

export async function RecentEventsPlaceholder() {
  const t = await getTranslations("dashboard");

  return (
    <Card
      title={t("recentEventsTitle")}
      description={t("recentEventsDescription")}
    >
      <div className="rounded-md border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
        <p className="text-sm font-medium">{t("recentEventsEmpty")}</p>
      </div>
    </Card>
  );
}
