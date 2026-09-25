import { getLocale, getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { TikTokConnectForm } from "@/components/tracking/tiktok-connect-form";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTikTokConnectionStateForUser } from "@/lib/integrations/tiktok/persistence";
import { getTikTokDeliveryStatsForUser } from "@/lib/integrations/tiktok/session/connection-store";
import type { TikTokConnectionPublicState } from "@/lib/integrations/tiktok/types";
import arTracking from "@/messages/ar/tracking.json";
import enTracking from "@/messages/en/tracking.json";

export default async function TikTokTrackingPage() {
  const locale = await getLocale();
  const copy = locale === "ar" ? arTracking.tiktok : enTracking.tiktok;
  const user = await getAuthenticatedUser();

  let status: TikTokConnectionPublicState = { provider: "tiktok", status: "not_connected" };
  if (user) {
    status = (await getTikTokConnectionStateForUser(user.id).catch(() => null)) ?? status;
  }

  const stats = user ? await getTikTokDeliveryStatsForUser(user.id).catch(() => null) : null;
  const pages = await getTranslations("dashboard.pages");

  return (
    <DashboardSection title={copy.title} description={copy.subtitle} backHref="/dashboard/tracking">
      <TikTokConnectForm copy={copy} initialStatus={status} />
      {stats ? (
        <section className="max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <h2 className="text-sm font-semibold">{copy.deliveries}</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted">{copy.pending}</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.pending}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.sent}</dt>
              <dd className="mt-1 text-2xl font-semibold text-emerald-700">{stats.sent}</dd>
            </div>
            <div>
              <dt className="text-muted">{copy.failed}</dt>
              <dd className="mt-1 text-2xl font-semibold">{stats.failed}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">{pages("trackingDescription")}</p>
        </section>
      ) : null}
    </DashboardSection>
  );
}
