"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface MediaPickerProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export function MediaPicker({ imageUrl, videoUrl }: MediaPickerProps) {
  const t = useTranslations("admin");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label={t("fields.imageUrl")}
        name="image_url"
        type="url"
        defaultValue={imageUrl ?? ""}
        placeholder="https://"
      />
      <Input
        label={t("fields.videoUrl")}
        name="video_url"
        type="url"
        defaultValue={videoUrl ?? ""}
        placeholder="https://www.youtube.com/watch?v="
      />
    </div>
  );
}
