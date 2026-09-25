import "server-only";

import { isAdminRole } from "@/lib/admin/roles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import type { VideoBlock, VideoInput, VideoPlacement } from "@/lib/videos/types";
import { videoPlacements } from "@/lib/videos/types";
import { parseYouTubeId, youtubeThumbnail } from "@/lib/videos/youtube";

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("video_blocks");
}

export async function getVideoForPlacement(placement: VideoPlacement): Promise<VideoBlock | null> {
  try {
    const db = await createUserDatabaseClient();
    const { data, error } = await db
      .from("video_blocks")
      .select("*")
      .eq("placement", placement)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingTable(error)) {
        return null;
      }
      return null;
    }

    return (data as VideoBlock | null) ?? null;
  } catch {
    return null;
  }
}

export async function listVideos(): Promise<VideoBlock[]> {
  await assertAdmin();
  const db = createDatabaseClient();
  const { data, error } = await db
    .from("video_blocks")
    .select("*")
    .order("placement", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as VideoBlock[] | null) ?? [];
}

export async function createVideo(input: VideoInput): Promise<VideoBlock> {
  const user = await assertAdmin();
  const row = normalizeInput(input);
  const db = createDatabaseClient();
  const { data, error } = await db
    .from("video_blocks")
    .insert({ ...row, created_by: user.id })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "create_failed");
  }

  return data as VideoBlock;
}

export async function updateVideo(id: string, input: VideoInput): Promise<VideoBlock> {
  await assertAdmin();
  const row = normalizeInput(input);
  const db = createDatabaseClient();
  const { data, error } = await db.from("video_blocks").update(row).eq("id", id).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "update_failed");
  }

  return data as VideoBlock;
}

export async function deleteVideo(id: string): Promise<void> {
  await assertAdmin();
  const db = createDatabaseClient();
  const { error } = await db.from("video_blocks").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

async function assertAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("unauthenticated");
  }

  const db = await createUserDatabaseClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(data?.role)) {
    throw new Error("forbidden");
  }

  return user;
}

function normalizeInput(input: VideoInput) {
  if (!videoPlacements.includes(input.placement)) {
    throw new Error("invalid_placement");
  }

  const youtubeUrl = input.youtube_url.trim();
  if (!parseYouTubeId(youtubeUrl)) {
    throw new Error("invalid_youtube_url");
  }

  const thumbnail = input.thumbnail_url?.trim() || youtubeThumbnail(youtubeUrl);

  return {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    youtube_url: youtubeUrl,
    thumbnail_url: thumbnail,
    placement: input.placement,
    position: Number.isFinite(input.position) ? Math.trunc(input.position ?? 0) : 0,
    is_active: input.is_active !== false,
  };
}
