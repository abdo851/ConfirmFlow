"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import type { MetaDeliveryRow } from "@/lib/dashboard/get-meta-deliveries-for-user";

export function MetaConnectionActions({
  deliveries,
}: {
  deliveries: MetaDeliveryRow[];
}) {
  const t = useTranslations("dashboard.pages.features.meta");
  const router = useRouter();
  const [pending, setPending] = useState<"test" | "disconnect" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function testEvent() {
    setPending("test");
    const response = await fetch("/api/dashboard/meta/test", { method: "POST" });
    const body = (await response.json().catch(() => null)) as { status?: string; message?: string } | null;
    setOk(response.ok && body?.status === "sent");
    setMessage(body?.message || body?.status || t("testFailed"));
    setPending(null);
    router.refresh();
  }

  async function disconnect() {
    setPending("disconnect");
    const response = await fetch("/api/integrations/meta/disconnect", { method: "POST" });
    setOk(response.ok);
    setMessage(response.ok ? t("disconnected") : t("disconnectFailed"));
    setPending(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {deliveries.length === 0 ? (
          <p className="rounded-2xl border border-line p-4 text-sm text-muted">{t("noDeliveries")}</p>
        ) : (
          deliveries.slice(0, 5).map((row) => (
            <article key={row.order_id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <p className="font-mono text-xs">{row.order_id.slice(0, 8)}</p>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("event")}</dt>
                  <dd>{row.event_type}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("status")}</dt>
                  <dd>{row.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("attempts")}</dt>
                  <dd>{row.attempts}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("attemptedAt")}</dt>
                  <dd>{row.last_attempted_at ? new Date(row.last_attempted_at).toLocaleString() : "—"}</dd>
                </div>
              </dl>
              <p className="mt-2 break-words text-muted">{row.last_error ?? "—"}</p>
            </article>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-3 py-2 text-start">{t("order")}</th>
              <th className="px-3 py-2 text-start">{t("event")}</th>
              <th className="px-3 py-2 text-start">{t("status")}</th>
              <th className="px-3 py-2 text-start">{t("attempts")}</th>
              <th className="px-3 py-2 text-start">{t("attemptedAt")}</th>
              <th className="px-3 py-2 text-start">{t("error")}</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={6}>
                  {t("noDeliveries")}
                </td>
              </tr>
            ) : (
              deliveries.slice(0, 5).map((row) => (
                <tr key={row.order_id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.order_id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{row.event_type}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.attempts}</td>
                  <td className="px-3 py-2">{row.last_attempted_at ? new Date(row.last_attempted_at).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2 text-muted">{row.last_error ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={pending === "test"} onClick={() => void testEvent()}>
          {t("testNow")}
        </Button>
        <Button type="button" variant="outline" loading={pending === "disconnect"} onClick={() => void disconnect()}>
          {t("disconnect")}
        </Button>
      </div>
      {message ? <Toast tone={ok ? "success" : "danger"}>{message}</Toast> : null}
    </div>
  );
}
