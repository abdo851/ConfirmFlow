import { getLocale, getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { GoogleConnectForm } from "@/components/tracking/google-connect-form";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getGoogleConnectionStateForUser } from "@/lib/integrations/google/persistence";
import { getGoogleDeliveryStatsForUser } from "@/lib/integrations/google/session/connection-store";
import type { GoogleConnectionPublicState } from "@/lib/integrations/google/types";
import arTracking from "@/messages/ar/tracking.json";
import enTracking from "@/messages/en/tracking.json";

export default async function GoogleTrackingPage() {
  const locale = await getLocale();
  const copy = locale === "ar" ? arTracking.google : enTracking.google;
  const user = await getAuthenticatedUser();

  let status: GoogleConnectionPublicState = { provider: "google", status: "not_connected" };
  if (user) {
    status = (await getGoogleConnectionStateForUser(user.id).catch(() => null)) ?? status;
  }

  const stats = user ? await getGoogleDeliveryStatsForUser(user.id).catch(() => null) : null;
  const pages = await getTranslations("dashboard.pages");

  return (
    <DashboardSection title={copy.title} description={copy.subtitle} backHref="/dashboard/tracking">
      <GoogleConnectForm copy={copy} initialStatus={status} />
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
