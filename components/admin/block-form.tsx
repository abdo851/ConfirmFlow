import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentBlockType, ContentLocale } from "@/lib/content/schema";
import { MediaPicker } from "./media-picker";

export interface BlockFormValues {
  type: ContentBlockType;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  locale?: ContentLocale;
  is_active?: boolean;
}

interface BlockFormProps {
  action: (formData: FormData) => Promise<void>;
  initial: BlockFormValues;
  submitLabel: string;
}

export async function BlockForm({ action, initial, submitLabel }: BlockFormProps) {
  const t = await getTranslations("admin");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={initial.type} />
      <p className="text-sm font-medium">{t(`types.${initial.type}`)}</p>
      <Input label={t("fields.title")} name="title" defaultValue={initial.title ?? ""} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("fields.description")}
        <textarea
          name="description"
          defaultValue={initial.description ?? ""}
          rows={4}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal"
        />
      </label>
      <MediaPicker imageUrl={initial.image_url} videoUrl={initial.video_url} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("fields.ctaLabel")} name="cta_label" defaultValue={initial.cta_label ?? ""} />
        <Input label={t("fields.ctaUrl")} name="cta_url" defaultValue={initial.cta_url ?? ""} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("fields.locale")}
        <select
          name="locale"
          defaultValue={initial.locale ?? "both"}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal"
        >
          <option value="both">{t("locales.both")}</option>
          <option value="ar">{t("locales.ar")}</option>
          <option value="en">{t("locales.en")}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={initial.is_active !== false} />
        {t("fields.active")}
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
