"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoForm } from "@/components/admin/video-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePlacedContentAction, savePlacedContentAction } from "@/lib/content/placement-actions";
import { placedContentKind, readBlockPlacement } from "@/lib/content/placement";
import type { ContentBlock } from "@/lib/content/schema";
import { deleteVideoAction } from "@/lib/videos/actions";
import type { VideoBlock } from "@/lib/videos/types";
import { placementChoices, type VideoPlacement } from "@/lib/videos/types";

type ContentKind = "video" | "banner" | "link";

export function PlatformContentManager({
  videos,
  blocks,
}: {
  videos: VideoBlock[];
  blocks: ContentBlock[];
}) {
  const t = useTranslations("admin.videos");
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<ContentKind | null>(null);
  const [video, setVideo] = useState<VideoBlock | null>(null);
  const [block, setBlock] = useState<ContentBlock | null>(null);

  function reset() {
    setAdding(false);
    setKind(null);
    setVideo(null);
    setBlock(null);
  }

  function choose(next: ContentKind) {
    setAdding(true);
    setKind(next);
    setVideo(null);
    setBlock(null);
  }

  const showForm = kind != null;

  return (
    <div className="grid gap-8">
      <div className="space-y-4">
        {showForm ? null : (
          <div className="space-y-3">
            <Button type="button" onClick={() => setAdding((open) => !open)}>
              {t("addContent")}
            </Button>
            {adding ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => choose("video")}>
                  {t("typeVideo")}
                </Button>
                <Button type="button" variant="outline" onClick={() => choose("banner")}>
                  {t("typeBanner")}
                </Button>
                <Button type="button" variant="outline" onClick={() => choose("link")}>
                  {t("typeLink")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
        {kind === "video" ? <VideoForm key={video?.id ?? "new-video"} video={video} onCancel={reset} /> : null}
        {kind === "banner" || kind === "link" ? (
          <PlacedForm key={block?.id ?? kind} kind={kind} block={block} onCancel={reset} />
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-muted dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("typeColumn")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("titleField")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("placement")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("position")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("active")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 && blocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-muted">
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
              {videos.map((item) => (
                <tr key={`video-${item.id}`} className="border-t border-line">
                  <td className="px-4 py-3">{t("typeVideo")}</td>
                  <td className="px-4 py-3 font-medium">{item.title || t("untitled")}</td>
                  <td className="px-4 py-3">{t(`placements.${item.placement}`)}</td>
                  <td className="px-4 py-3">{item.position}</td>
                  <td className="px-4 py-3 text-muted">{item.is_active ? t("active") : t("hidden")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setKind("video");
                          setVideo(item);
                          setBlock(null);
                          setAdding(false);
                        }}
                      >
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
                        <input type="hidden" name="id" value={item.id} />
                        <Button type="submit" variant="danger">
                          {t("delete")}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {blocks.map((item) => {
                const itemKind = placedContentKind(item);
                const placement = readBlockPlacement(item.extra);
                if (!itemKind || !placement) {
                  return null;
                }
                return (
                  <tr key={`block-${item.id}`} className="border-t border-line">
                    <td className="px-4 py-3">{itemKind === "banner" ? t("typeBanner") : t("typeLink")}</td>
                    <td className="px-4 py-3 font-medium">{item.title || t("untitledItem")}</td>
                    <td className="px-4 py-3">{t(`placements.${placement}`)}</td>
                    <td className="px-4 py-3">{item.position}</td>
                    <td className="px-4 py-3 text-muted">{item.is_active ? t("active") : t("hidden")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setKind(itemKind);
                            setBlock(item);
                            setVideo(null);
                            setAdding(false);
                          }}
                        >
                          {t("edit")}
                        </Button>
                        <form
                          action={deletePlacedContentAction}
                          onSubmit={(event) => {
                            if (!window.confirm(t("deleteContentConfirm"))) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <Button type="submit" variant="danger">
                            {t("delete")}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function contentError(t: (key: string) => string, code: string | undefined): string {
  const known = [
    "invalid_placement",
    "invalid_type",
    "invalid_url",
    "image_required",
    "link_required",
    "missing_id",
    "failed",
    "UNAUTHENTICATED",
    "FORBIDDEN",
  ];
  if (code && known.includes(code)) {
    return t(`errors.${code}`);
  }
  return t("errors.failed");
}

function PlacedForm({
  kind,
  block,
  onCancel,
}: {
  kind: "banner" | "link";
  block: ContentBlock | null;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.videos");
  const initialPlacement = block ? readBlockPlacement(block.extra) ?? "overview" : "overview";
  const [placement, setPlacement] = useState<VideoPlacement>(initialPlacement);
  const [position, setPosition] = useState(String(block?.position && block.position > 0 ? block.position : 1));
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-soft"
      action={async (formData) => {
        const result = await savePlacedContentAction({ ok: false }, formData);
        setMessage(result.ok ? t("saved") : contentError(t, result.error));
        if (result.ok) {
          onCancel();
        }
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {block ? <input type="hidden" name="id" value={block.id} /> : null}
      <p className="text-sm font-medium">{kind === "banner" ? t("typeBanner") : t("typeLink")}</p>
      <Input label={t("titleField")} name="title" defaultValue={block?.title ?? ""} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("descriptionField")}
        <textarea
          name="description"
          defaultValue={block?.description ?? ""}
          className="min-h-24 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal"
        />
      </label>
      <Input
        label={t("imageUrl")}
        name="image_url"
        defaultValue={block?.image_url ?? ""}
        required={kind === "banner"}
      />
      <Input label={t("ctaLabel")} name="cta_label" defaultValue={block?.cta_label ?? ""} required={kind === "link"} />
      <Input label={t("ctaUrl")} name="cta_url" defaultValue={block?.cta_url ?? ""} required={kind === "link"} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("placement")}
        <select
          name="placement"
          value={placement}
          onChange={(event) => setPlacement(event.target.value as VideoPlacement)}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal"
        >
          {placementChoices(placement).map((value) => (
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
        <input type="checkbox" name="is_active" defaultChecked={block?.is_active ?? true} />
        {t("active")}
      </label>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit">{block ? t("save") : t("save")}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
