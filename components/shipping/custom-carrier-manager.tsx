"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  deleteCustomCarrierAction,
  saveCustomCarrierAction,
  setCustomCarrierStatusAction,
  testCustomCarrierAction,
} from "@/lib/integrations/shipping/custom/actions";
import type { CustomCarrierPublic } from "@/lib/integrations/shipping/custom/public";

type ConnectionType = "webhook" | "api";
type AuthType = "bearer" | "x-api-key" | "basic";

type FormState = {
  name: string;
  connectionType: ConnectionType;
  webhookUrl: string;
  signingSecret: string;
  apiBaseUrl: string;
  apiKey: string;
  apiAuthType: AuthType;
  createShipmentPath: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  connectionType: "webhook",
  webhookUrl: "",
  signingSecret: "",
  apiBaseUrl: "",
  apiKey: "",
  apiAuthType: "bearer",
  createShipmentPath: "/shipments",
  active: true,
});

export function CustomCarrierManager({
  initialCarriers,
  storageReady,
}: {
  initialCarriers: CustomCarrierPublic[];
  storageReady: boolean;
}) {
  const t = useTranslations("dashboard.customCarrier");
  const locale = useLocale();
  const [carriers, setCarriers] = useState(initialCarriers);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomCarrierPublic | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(carrier: CustomCarrierPublic) {
    setEditingId(carrier.id);
    setNotice(null);
    setError(null);
    setForm({
      name: carrier.name,
      connectionType: carrier.connectionType,
      webhookUrl: carrier.webhookUrl ?? "",
      signingSecret: "",
      apiBaseUrl: carrier.apiBaseUrl ?? "",
      apiKey: "",
      apiAuthType: carrier.apiAuthType ?? "bearer",
      createShipmentPath: carrier.createShipmentPath ?? "/shipments",
      active: carrier.status === "active",
    });
  }

  async function onTest() {
    const url = form.connectionType === "webhook" ? form.webhookUrl : form.apiBaseUrl;
    setTesting(true);
    setNotice(null);
    setError(null);
    try {
      const result = await testCustomCarrierAction(url);
      if (result.error === "https_required") {
        setError(t("httpsOnly"));
      } else if (result.ok) {
        setNotice(t("testOk"));
      } else {
        setError(result.status ? `${t("testFailed")} (${result.status})` : t("testFailed"));
      }
    } finally {
      setTesting(false);
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    const payload =
      form.connectionType === "webhook"
        ? {
            name: form.name,
            connectionType: "webhook" as const,
            webhookUrl: form.webhookUrl,
            signingSecret: form.signingSecret,
            active: form.active,
          }
        : {
            name: form.name,
            connectionType: "api" as const,
            apiBaseUrl: form.apiBaseUrl,
            apiKey: form.apiKey,
            apiAuthType: form.apiAuthType,
            createShipmentPath: form.createShipmentPath,
            active: form.active,
          };
    try {
      const result = await saveCustomCarrierAction(payload, editingId ?? undefined);
      if (!result.ok) {
        setError(result.error === "invalid" ? t("httpsOnly") : t("saveFailed"));
        return;
      }
      setCarriers((current) => {
        const next = current.filter((item) => item.id !== result.carrier.id);
        return [result.carrier, ...next];
      });
      setForm(emptyForm());
      setEditingId(null);
      setNotice(t("saved"));
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(carrier: CustomCarrierPublic) {
    const status = carrier.status === "active" ? "inactive" : "active";
    const result = await setCustomCarrierStatusAction(carrier.id, status);
    if (!result.ok) {
      setError(t("saveFailed"));
      return;
    }
    setCarriers((current) => current.map((item) => (item.id === result.carrier.id ? result.carrier : item)));
  }

  async function onDelete(carrier: CustomCarrierPublic) {
    const result = await deleteCustomCarrierAction(carrier.id);
    if (!result.ok) {
      setError(t("saveFailed"));
      return;
    }
    setCarriers((current) => current.filter((item) => item.id !== carrier.id));
    if (editingId === carrier.id) {
      setEditingId(null);
      setForm(emptyForm());
    }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OptionCard title={t("optionWebhookTitle")} body={t("optionWebhookBody")} badge={t("recommended")} />
        <OptionCard title={t("optionApiTitle")} body={t("optionApiBody")} />
        <OptionCard title={t("optionManualTitle")} body={t("optionManualBody")}>
          <Link
            href="/dashboard/orders?status=confirmed"
            className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("exportConfirmed")}
          </Link>
        </OptionCard>
      </div>

      {!storageReady ? <p className="text-sm text-amber-800 dark:text-amber-200">{t("unavailable")}</p> : null}

      <form
        onSubmit={onSave}
        className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-soft dark:bg-slate-950"
      >
        <h2 className="text-lg font-semibold tracking-tight">{t("newConnection")}</h2>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">{t("companyName")}</span>
          <input
            required
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("typeWebhook")} / {t("typeApi")}</legend>
          <div className="flex flex-wrap gap-3">
            {(["webhook", "api"] as const).map((type) => (
              <label key={type} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm">
                <input
                  type="radio"
                  name="connectionType"
                  checked={form.connectionType === type}
                  onChange={() => update("connectionType", type)}
                />
                {type === "webhook" ? t("typeWebhook") : t("typeApi")}
              </label>
            ))}
          </div>
        </fieldset>
        {form.connectionType === "webhook" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("webhookUrl")}</span>
              <input
                required
                type="url"
                inputMode="url"
                value={form.webhookUrl}
                onChange={(event) => update("webhookUrl", event.target.value)}
                placeholder="https://"
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("signingSecret")}</span>
              <input
                value={form.signingSecret}
                onChange={(event) => update("signingSecret", event.target.value)}
                autoComplete="off"
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              />
              <span className="text-xs text-muted">{t("signingSecretHint")}</span>
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("baseUrl")}</span>
              <input
                required
                type="url"
                inputMode="url"
                value={form.apiBaseUrl}
                onChange={(event) => update("apiBaseUrl", event.target.value)}
                placeholder="https://"
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("apiKey")}</span>
              <input
                required={!editingId}
                value={form.apiKey}
                onChange={(event) => update("apiKey", event.target.value)}
                autoComplete="off"
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              />
              <span className="text-xs text-muted">{t("apiKeyHint")}</span>
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("authType")}</span>
              <select
                value={form.apiAuthType}
                onChange={(event) => update("apiAuthType", event.target.value as AuthType)}
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              >
                <option value="bearer">{t("authBearer")}</option>
                <option value="x-api-key">{t("authHeader")}</option>
                <option value="basic">{t("authBasic")}</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("shipmentPath")}</span>
              <input
                required
                value={form.createShipmentPath}
                onChange={(event) => update("createShipmentPath", event.target.value)}
                className="min-h-11 w-full rounded-xl border border-line bg-white px-3 dark:bg-slate-950"
              />
            </label>
          </div>
        )}
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} />
          {t("active")}
        </label>
        {notice ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
        {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" loading={testing} onClick={onTest}>
            {testing ? t("testing") : t("testConnection")}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("listTitle")}</h2>
        {carriers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {carriers.map((carrier) => (
              <li
                key={carrier.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-950"
              >
                <div>
                  <p className="font-medium">{carrier.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {carrier.connectionType === "webhook" ? t("typeWebhook") : t("typeApi")}
                    {" · "}
                    {carrier.status === "active" ? t("statusActive") : t("statusInactive")}
                    {" · "}
                    {t("created")}{" "}
                    {new Date(carrier.createdAt).toLocaleDateString(locale === "ar" ? "ar" : "en")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(carrier)}>
                    {t("edit")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onToggle(carrier)}>
                    {carrier.status === "active" ? t("deactivate") : t("activate")}
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => setPendingDelete(carrier)}>
                    {t("delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label={t("cancel")} onClick={() => setPendingDelete(null)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-medium dark:bg-slate-950">
            <h3 className="text-lg font-semibold">{t("deleteTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{t("deleteBody")}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
                {t("cancel")}
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(pendingDelete)}>
                {t("deleteConfirm")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionCard({
  title,
  body,
  badge,
  children,
}: {
  title: string;
  body: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-soft dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      {children}
    </article>
  );
}
