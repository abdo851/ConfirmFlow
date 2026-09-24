"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import type { UserWebhook } from "@/lib/dashboard/get-webhooks-for-user";

function truncate(value: string) {
  if (value.length <= 42) {
    return value;
  }
  return `${value.slice(0, 28)}…${value.slice(-10)}`;
}

export function WebhooksTable({ webhooks }: { webhooks: UserWebhook[] }) {
  const t = useTranslations("dashboard.pages.features.webhooks");
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function post(url: string, body?: object, key?: string) {
    setPending(key ?? url);
    setMessage(null);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
    });
    setOk(response.ok);
    setMessage(response.ok ? t("actionOk") : t("actionFailed"));
    setPending(null);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" loading={pending === "all"} onClick={() => void post("/api/dashboard/webhooks/reregister", {}, "all")}>
        {t("reregisterAll")}
      </Button>
      {webhooks.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <>
        <div className="grid gap-3 md:hidden">
          {webhooks.map((webhook) => (
            <article key={`${webhook.connection_id}-${webhook.webhook_id}`} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="accent">WooCommerce</Badge>
                <span className="text-sm">{webhook.status === "active" ? t("active") : t("paused")}</span>
              </div>
              <p className="mt-3 text-sm font-medium">{webhook.topic}</p>
              <p className="mt-1 break-all text-sm text-muted" title={webhook.delivery_url}>
                {truncate(webhook.delivery_url)}
              </p>
              <p className="mt-2 text-sm text-muted">
                {webhook.last_delivery_at ? new Date(webhook.last_delivery_at).toLocaleString() : "—"}
                {webhook.last_delivery_status ? ` · ${webhook.last_delivery_status}` : ""}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  loading={pending === `test-${webhook.webhook_id}`}
                  onClick={() =>
                    void post(
                      "/api/dashboard/webhooks/test",
                      { connectionId: webhook.connection_id },
                      `test-${webhook.webhook_id}`,
                    )
                  }
                >
                  {t("test")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  loading={pending === `reg-${webhook.webhook_id}`}
                  onClick={() => void post("/api/dashboard/webhooks/reregister", {}, `reg-${webhook.webhook_id}`)}
                >
                  {t("reregister")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  loading={pending === `del-${webhook.webhook_id}`}
                  onClick={() =>
                    void post(
                      "/api/dashboard/webhooks/delete",
                      { connectionId: webhook.connection_id, webhookId: webhook.webhook_id },
                      `del-${webhook.webhook_id}`,
                    )
                  }
                >
                  {t("delete")}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-3 py-3 text-start font-medium">{t("provider")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("topic")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("deliveryUrl")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("lastDelivery")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={`${webhook.connection_id}-${webhook.webhook_id}`} className="border-b border-line last:border-0">
                  <td className="px-3 py-3">
                    <Badge variant="accent">WooCommerce</Badge>
                  </td>
                  <td className="px-3 py-3 font-medium">{webhook.topic}</td>
                  <td className="px-3 py-3 text-muted" title={webhook.delivery_url}>
                    {truncate(webhook.delivery_url)}
                  </td>
                  <td className="px-3 py-3">{webhook.status === "active" ? t("active") : t("paused")}</td>
                  <td className="px-3 py-3 text-muted">
                    {webhook.last_delivery_at ? new Date(webhook.last_delivery_at).toLocaleString() : "—"}
                    {webhook.last_delivery_status ? ` · ${webhook.last_delivery_status}` : ""}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        loading={pending === `test-${webhook.webhook_id}`}
                        onClick={() =>
                          void post(
                            "/api/dashboard/webhooks/test",
                            { connectionId: webhook.connection_id },
                            `test-${webhook.webhook_id}`,
                          )
                        }
                      >
                        {t("test")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        loading={pending === `reg-${webhook.webhook_id}`}
                        onClick={() => void post("/api/dashboard/webhooks/reregister", {}, `reg-${webhook.webhook_id}`)}
                      >
                        {t("reregister")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        loading={pending === `del-${webhook.webhook_id}`}
                        onClick={() =>
                          void post(
                            "/api/dashboard/webhooks/delete",
                            { connectionId: webhook.connection_id, webhookId: webhook.webhook_id },
                            `del-${webhook.webhook_id}`,
                          )
                        }
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {message ? <Toast tone={ok ? "success" : "danger"}>{message}</Toast> : null}
    </div>
  );
}
