"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoEmbed } from "@/components/marketing/video-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVideoAction, deleteVideoAction, updateVideoAction } from "@/lib/videos/actions";
import type { VideoBlock } from "@/lib/videos/types";
import { videoPlacements } from "@/lib/videos/types";

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
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-muted dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("titleField")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("placement")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("active")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-muted">
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
              {videos.map((video) => (
                <tr key={video.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{video.title || t("untitled")}</td>
                  <td className="px-4 py-3">{t(`placements.${video.placement}`)}</td>
                  <td className="px-4 py-3 text-muted">{video.is_active ? t("active") : t("hidden")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditing(video)}>
                        {t("edit")}
                      </Button>
                      <form
                        action={deleteVideoAction}
                        onSubmit={(event) => {
                          if (!window.confirm(t("deleteConfirm"))) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={video.id} />
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
    </div>
  );
}

function VideoForm({ video, onCancel }: { video: VideoBlock | null; onCancel: () => void }) {
  const t = useTranslations("admin.videos");
  const [url, setUrl] = useState(video?.youtube_url ?? "");
  const [title, setTitle] = useState(video?.title ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [placement, setPlacement] = useState<VideoBlock["placement"]>(video?.placement ?? "overview");
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
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("placement")}
        <select
          name="placement"
          value={placement}
          onChange={(event) => setPlacement(event.target.value as VideoBlock["placement"])}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal"
        >
          {videoPlacements.map((value) => (
            <option key={value} value={value}>
              {t(`placements.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <Input
        label={t("position")}
        name="position"
        type="number"
        min={1}
        value={placement === "landing_hero" ? "1" : position}
        readOnly={placement === "landing_hero"}
        onChange={(event) => setPosition(event.target.value)}
        helperText={placement === "landing_hero" ? t("landingPosition") : t("positionHint")}
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
