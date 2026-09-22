import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listWooCommerceWebhooksForCurrentUser } from "@/lib/dashboard/list-woocommerce-webhooks";

export default async function WebhooksPage() {
  const pages = await getTranslations("dashboard.pages");
  const stores = await listWooCommerceWebhooksForCurrentUser();

  return (
    <DashboardSection
      title={pages("webhooksTitle")}
      description={pages("webhooksDescription")}
      backHref="/dashboard/connections"
    >
      {stores.length === 0 ? (
        <EmptyState title={pages("noWebhooks")} description={pages("webhooksDescription")} />
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.storeUrl || "store"} title={store.storeUrl || pages("webhooksTitle")}>
              <p className="text-sm text-muted">
                {pages("webhookStatus")}: {store.webhookIds.length > 0 ? pages("registered") : pages("missing")}
              </p>
              <p className="mt-2 text-sm text-muted">
                {pages("lastDelivery")}: {store.updatedAt || "—"}
              </p>
              {store.webhookIds.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {store.webhookIds.map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      <Button href="/onboarding/store">{pages("reregister")}</Button>
    </DashboardSection>
  );
}
