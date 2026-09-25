"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoEmbed } from "@/components/marketing/video-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVideoAction, deleteVideoAction, updateVideoAction } from "@/lib/videos/actions";
import type { VideoBlock } from "@/lib/videos/types";

export function VideoManager({ videos }: { videos: VideoBlock[] }) {
  const t = useTranslations("admin.videos");
  const [editing, setEditing] = useState<VideoBlock | null>(null);

  return (
    <div className="grid gap-8">
      <div className="space-y-4">
        <VideoForm
          key={editing?.id ?? "new"}
          video={editing}
          onCancel={() => setEditing(null)}
        />
        <ul className="space-y-3">
          {videos.length === 0 ? <li className="text-sm text-muted">{t("empty")}</li> : null}
          {videos.map((video) => (
            <li key={video.id} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="font-medium">{video.title || t("untitled")}</p>
              <p className="mt-1 text-sm text-muted">
                {t(`placements.${video.placement}`)} · {video.position} · {video.is_active ? t("active") : t("hidden")}
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(video)}>
                  {t("edit")}
                </Button>
                <form action={deleteVideoAction}>
                  <input type="hidden" name="id" value={video.id} />
                  <Button type="submit" variant="ghost">
                    {t("delete")}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VideoForm({ video, onCancel }: { video: VideoBlock | null; onCancel: () => void }) {
  const t = useTranslations("admin.videos");
  const [url, setUrl] = useState(video?.youtube_url ?? "");
  const [title, setTitle] = useState(video?.title ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [surface, setSurface] = useState<"dashboard" | "landing" | "onboarding">(
    video?.placement === "onboarding_top"
      ? "onboarding"
      : video?.placement === "landing_hero" || video?.placement === "landing_below_hero"
        ? "landing"
        : "dashboard",
  );
  const [position, setPosition] = useState(String(video?.position && video.position > 0 ? video.position : 1));
  const [message, setMessage] = useState<string | null>(null);
  const action = video ? updateVideoAction : createVideoAction;

  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-soft"
      action={async (formData) => {
        const result = await action({ ok: false }, formData);
        setMessage(result.ok ? t("saved") : result.error ?? t("failed"));
        if (result.ok && !video) {
          setUrl("");
          setTitle("");
          setDescription("");
        }
        if (result.ok) {
          onCancel();
        }
      }}
    >
      {video ? <input type="hidden" name="id" value={video.id} /> : null}
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
      <Input label={t("youtubeUrl")} name="youtube_url" value={url} onChange={(event) => setUrl(event.target.value)} required />
      <fieldset className="grid gap-2 text-sm font-medium">
        <legend>{t("surface")}</legend>
        {(
          [
            ["dashboard", t("surfaceDashboard")],
            ["landing", t("surfaceLanding")],
            ["onboarding", t("surfaceOnboarding")],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="inline-flex min-h-11 items-center gap-2 font-normal">
            <input
              type="radio"
              name="surface"
              checked={surface === value}
              onChange={() => setSurface(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <input
        type="hidden"
        name="placement"
        value={surface === "landing" ? "landing_hero" : surface === "onboarding" ? "onboarding_top" : "dashboard_top"}
      />
      <Input
        label={t("position")}
        name="position"
        type="number"
        min={1}
        value={surface === "landing" ? "1" : position}
        readOnly={surface === "landing"}
        onChange={(event) => setPosition(event.target.value)}
        helperText={surface === "landing" ? t("landingPosition") : t("positionHint")}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_active" defaultChecked={video?.is_active ?? true} />
        {t("active")}
      </label>
      {url ? (
        <VideoEmbed
          variant="card"
          video={{
            title,
            description,
            youtube_url: url,
            thumbnail_url: null,
          }}
        />
      ) : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit">{video ? t("save") : t("create")}</Button>
        {video ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
