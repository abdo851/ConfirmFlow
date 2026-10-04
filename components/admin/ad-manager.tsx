"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { safeHttpUrl } from "@/lib/ads/select";
import type { Advertisement } from "@/lib/ads/types";
import { adLocales, adPlacements } from "@/lib/ads/types";
import { createAdvertisementAction, deleteAdvertisementAction, updateAdvertisementAction } from "@/lib/ads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const knownErrors = new Set([
  "invalid_placement",
  "invalid_locale",
  "unauthenticated",
  "forbidden",
  "create_failed",
  "update_failed",
  "missing_id",
  "failed",
]);

function errorText(t: ReturnType<typeof useTranslations<"admin.advertisements">>, code: string | undefined) {
  if (code && knownErrors.has(code)) {
    return t(`errors.${code as "failed"}`);
  }
  return t("errors.failed");
}

export function AdManager({ advertisements }: { advertisements: Advertisement[] }) {
  const t = useTranslations("admin.advertisements");
  const [editing, setEditing] = useState<Advertisement | null>(null);

  return (
    <div className="grid gap-8">
      <AdForm key={editing?.id ?? "new"} advertisement={editing} onCancel={() => setEditing(null)} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-muted dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("titleField")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("placement")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("locale")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("active")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {advertisements.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-muted">
                  {t("empty")}
                </td>
              </tr>
            ) : null}
            {advertisements.map((ad) => (
              <tr key={ad.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{ad.title || t("untitled")}</td>
                <td className="px-4 py-3">{t(`placements.${ad.placement}`)}</td>
                <td className="px-4 py-3">{t(`locales.${ad.locale}`)}</td>
                <td className="px-4 py-3 text-muted">{ad.is_active ? t("active") : t("hidden")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditing(ad)}>
                      {t("edit")}
                    </Button>
                    <form
                      action={deleteAdvertisementAction}
                      onSubmit={(event) => {
                        if (!window.confirm(t("deleteConfirm"))) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={ad.id} />
                      <Button type="submit" variant="danger">
                        {t("delete")}
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdForm({
  advertisement,
  onCancel,
}: {
  advertisement: Advertisement | null;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.advertisements");
  const [placement, setPlacement] = useState<Advertisement["placement"]>(advertisement?.placement ?? "overview");
  const [locale, setLocale] = useState<Advertisement["locale"]>(advertisement?.locale ?? "both");
  const [title, setTitle] = useState(advertisement?.title ?? "");
  const [description, setDescription] = useState(advertisement?.description ?? "");
  const [imageUrl, setImageUrl] = useState(advertisement?.image_url ?? "");
  const [ctaLabel, setCtaLabel] = useState(advertisement?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(advertisement?.cta_url ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const action = advertisement ? updateAdvertisementAction : createAdvertisementAction;
  const previewImage = safeHttpUrl(imageUrl);
  const previewCta = safeHttpUrl(ctaUrl);

  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-soft"
      action={async (formData) => {
        const result = await action({ ok: false }, formData);
        setMessage(result.ok ? t("saved") : errorText(t, result.error));
        if (result.ok && !advertisement) {
          setTitle("");
          setDescription("");
          setImageUrl("");
          setCtaLabel("");
          setCtaUrl("");
        }
        if (result.ok) {
          onCancel();
        }
      }}
    >
      {advertisement ? <input type="hidden" name="id" value={advertisement.id} /> : null}
      <Input label={t("titleField")} name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("descriptionField")}
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal"
        />
      </label>
      <Input
        label={t("imageUrl")}
        name="image_url"
        type="url"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("ctaLabel")} name="cta_label" value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} />
        <Input label={t("ctaUrl")} name="cta_url" type="url" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("placement")}
        <select
          name="placement"
          value={placement}
          onChange={(event) => setPlacement(event.target.value as Advertisement["placement"])}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal"
        >
          {adPlacements.map((value) => (
            <option key={value} value={value}>
              {t(`placements.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("locale")}
        <select
          name="locale"
          value={locale}
          onChange={(event) => setLocale(event.target.value as Advertisement["locale"])}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal"
        >
          {adLocales.map((value) => (
            <option key={value} value={value}>
              {t(`locales.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <Input
        label={t("position")}
        name="position"
        type="number"
        defaultValue={advertisement?.position ?? 0}
        helperText={t("positionHint")}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_active" defaultChecked={advertisement?.is_active ?? true} />
        {t("active")}
      </label>
      <article className="rounded-2xl border border-line bg-surface-muted/40 p-4">
        <p className="text-xs font-medium text-muted">{t("preview")}</p>
        {previewImage ? (
          <div
            role="img"
            aria-label={title}
            className="mt-3 h-32 w-full rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(previewImage)})` }}
          />
        ) : null}
        {title ? <p className="mt-3 text-base font-semibold">{title}</p> : null}
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
        {ctaLabel && previewCta ? (
          <span className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
            {ctaLabel}
          </span>
        ) : null}
      </article>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit">{advertisement ? t("save") : t("create")}</Button>
        {advertisement ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
