import { getTranslations } from "next-intl/server";
import { MetaConnectionActions } from "@/components/dashboard/meta-connection-actions";
import { DashboardSection } from "@/components/dashboard/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMetaDeliveriesForUser, metaConnectionMode } from "@/lib/dashboard/get-meta-deliveries-for-user";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export default async function MetaConnectionPage() {
  const pages = await getTranslations("dashboard.pages.features.meta");
  const section = await getTranslations("dashboard.pages");
  const meta = await getMetaConnectionPublicState().catch(() => ({
    provider: "meta" as const,
    status: "not_connected" as const,
  }));
  const mode = metaConnectionMode(meta.status);
  const deliveries = mode === "details" ? await getMetaDeliveriesForUser(5) : [];
  let pixelId = "pixelId" in meta ? meta.pixelId : undefined;
  if (mode === "details") {
    try {
      const db = await createUserDatabaseClient();
      const { data } = await db.from("meta_connections").select("pixel_id").limit(1).maybeSingle();
      if (data?.pixel_id) {
        pixelId = String(data.pixel_id);
      }
    } catch {
      pixelId = pixelId;
    }
  }

  return (
    <DashboardSection title={section("metaTitle")} description={section("metaDescription")} backHref="/dashboard/connections">
      {mode === "connect" ? (
        <Card title={pages("connectTitle")} description={pages("connectBody")}>
          <Button href="/onboarding/meta">{pages("connectButton")}</Button>
        </Card>
      ) : (
        <Card title={pages("connectedTitle")}>
          <dl className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{pages("pixelId")}</dt>
              <dd className="font-medium">{pixelId || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{pages("verification")}</dt>
              <dd>
                <Badge variant={"verificationStatus" in meta && meta.verificationStatus === "verified" ? "success" : "warning"}>
                  {"verificationStatus" in meta ? meta.verificationStatus ?? "unverified" : "unverified"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{pages("verifiedAt")}</dt>
              <dd>{"verifiedAt" in meta && meta.verifiedAt ? new Date(meta.verifiedAt).toLocaleString() : "—"}</dd>
            </div>
          </dl>
          <MetaConnectionActions deliveries={deliveries} />
        </Card>
      )}
    </DashboardSection>
  );
}
