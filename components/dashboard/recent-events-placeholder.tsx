import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export async function RecentEventsPlaceholder() {
  const t = await getTranslations("dashboard");

  return (
    <Card
      title={t("recentEventsTitle")}
      description={t("recentEventsDescription")}
      interactive
    >
      <EmptyState title={t("recentEventsEmpty")} description={t("recentEventsDescription")} />
    </Card>
  );
}
