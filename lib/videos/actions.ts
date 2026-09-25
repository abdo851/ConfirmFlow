"use server";

import { revalidatePath } from "next/cache";
import { createVideo, deleteVideo, updateVideo } from "@/lib/videos/queries";
import type { VideoPlacement } from "@/lib/videos/types";
import { videoPlacements } from "@/lib/videos/types";

export interface VideoActionState {
  ok: boolean;
  error?: string;
}

function readPlacement(value: FormDataEntryValue | null): VideoPlacement {
  const placement = String(value ?? "");
  if (videoPlacements.includes(placement as VideoPlacement)) {
    return placement as VideoPlacement;
  }
  throw new Error("invalid_placement");
}

function readInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    youtube_url: String(formData.get("youtube_url") ?? ""),
    placement: readPlacement(formData.get("placement")),
    position: Number(formData.get("position") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

function refresh() {
  for (const path of ["/ar", "/en", "/ar/dashboard", "/en/dashboard", "/ar/onboarding", "/en/onboarding", "/ar/dashboard/admin/videos", "/en/dashboard/admin/videos"]) {
    revalidatePath(path);
  }
}

export async function createVideoAction(_state: VideoActionState, formData: FormData): Promise<VideoActionState> {
  try {
    await createVideo(readInput(formData));
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "create_failed" };
  }
}

export async function updateVideoAction(_state: VideoActionState, formData: FormData): Promise<VideoActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { ok: false, error: "missing_id" };
    }
    await updateVideo(id, readInput(formData));
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "update_failed" };
  }
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await deleteVideo(id);
  refresh();
}
