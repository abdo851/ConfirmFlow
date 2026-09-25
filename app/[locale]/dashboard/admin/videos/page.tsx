import { getTranslations } from "next-intl/server";
import { VideoManager } from "@/components/admin/video-manager";
import { listVideos } from "@/lib/videos/queries";
import type { VideoBlock } from "@/lib/videos/types";

export default async function AdminVideosPage() {
  const t = await getTranslations("admin.videos");
  let videos: VideoBlock[] = [];
  let loadError: string | null = null;

  try {
    videos = await listVideos();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "load_failed";
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t("description")}</p>
      </div>
      {loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}
      <VideoManager videos={videos} />
    </div>
  );
}
