import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export async function MetaStatusCard({
  connected,
  pixelId,
  verificationStatus,
  lastDelivery,
  showTest,
  testSlot,
}: {
  connected: boolean;
  pixelId?: string;
  verificationStatus?: string;
  lastDelivery?: string | null;
  showTest?: boolean;
  testSlot?: ReactNode;
}) {
  const t = await getTranslations("dashboard.pages");

  return (
    <Card title={t("metaTitle")} description={connected ? t("metaConnected") : t("notConnected")}>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("pixelId")}</dt>
          <dd className="font-medium">{pixelId || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("verification")}</dt>
          <dd className="font-medium">{verificationStatus || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("lastDelivery")}</dt>
          <dd className="max-w-xs text-end font-medium">{lastDelivery || "—"}</dd>
        </div>
      </dl>
      {connected ? null : (
        <div className="mt-4">
          <Button href="/onboarding/meta">{t("connectMeta")}</Button>
        </div>
      )}
      {showTest ? <div className="mt-4">{testSlot}</div> : null}
      <p className="mt-4 text-sm">
        <Link href="/dashboard/connections" className="text-primary underline">
          {t("backToConnections")}
        </Link>
      </p>
    </Card>
  );
}
