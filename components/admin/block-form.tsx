import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentBlockType, ContentLocale } from "@/lib/content/schema";

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
  const showImage = initial.type === "banner" || initial.type === "ad";
  const showVideo = initial.type === "video";
  const showCta = initial.type === "banner" || initial.type === "ad";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={initial.type} />
      <input type="hidden" name="locale" value={initial.locale ?? "both"} />
      {showImage ? null : <input type="hidden" name="image_url" value={initial.image_url ?? ""} />}
      {showVideo ? null : <input type="hidden" name="video_url" value={initial.video_url ?? ""} />}
      {showCta ? null : <input type="hidden" name="cta_label" value={initial.cta_label ?? ""} />}
      {showCta ? null : <input type="hidden" name="cta_url" value={initial.cta_url ?? ""} />}
      <p className="text-sm font-medium sm:text-base">{t(`types.${initial.type}`)}</p>
      <Input label={t("fields.title")} name="title" defaultValue={initial.title ?? ""} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("fields.description")}
        <textarea
          name="description"
          defaultValue={initial.description ?? ""}
          rows={4}
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal sm:text-base"
        />
      </label>
      {showImage ? (
        <Input
          label={t("fields.imageUrl")}
          name="image_url"
          type="url"
          defaultValue={initial.image_url ?? ""}
          placeholder="https://"
        />
      ) : null}
      {showVideo ? (
        <Input
          label={t("fields.videoUrl")}
          name="video_url"
          type="url"
          defaultValue={initial.video_url ?? ""}
          placeholder="https://www.youtube.com/watch?v="
        />
      ) : null}
      {showCta ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("fields.ctaLabel")} name="cta_label" defaultValue={initial.cta_label ?? ""} />
          <Input label={t("fields.ctaUrl")} name="cta_url" type="url" defaultValue={initial.cta_url ?? ""} />
        </div>
      ) : null}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={initial.is_active !== false} className="size-5" />
        {t("fields.active")}
      </label>
      <Button type="submit" className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
