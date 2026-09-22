import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/admin/roles";
import { createDatabaseClient } from "@/lib/database/client";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import {
  parseContentBlockInput,
  reorderBlockIds,
  type ContentBlock,
  type ContentBlockInput,
  type ContentLocale,
} from "./schema";

const COLUMNS =
  "id, type, title, description, image_url, video_url, cta_label, cta_url, extra, position, is_active, locale, created_by, created_at, updated_at";

function mapBlock(row: Record<string, unknown>): ContentBlock {
  return {
    id: String(row.id),
    type: row.type as ContentBlock["type"],
    title: (row.title as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    video_url: (row.video_url as string | null) ?? null,
    cta_label: (row.cta_label as string | null) ?? null,
    cta_url: (row.cta_url as string | null) ?? null,
    extra:
      row.extra && typeof row.extra === "object"
        ? (row.extra as Record<string, unknown>)
        : {},
    position: Number(row.position ?? 0),
    is_active: Boolean(row.is_active),
    locale: (row.locale as ContentLocale) ?? "both",
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function readClient(): Promise<SupabaseClient> {
  return createUserDatabaseClient();
}

function writeClient(): SupabaseClient {
  return createDatabaseClient();
}

export async function requireContentAdmin(): Promise<string> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const db = await readClient();
  const { data, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to read profile role.");
  }

  if (!isAdminRole(data?.role)) {
    throw new Error("FORBIDDEN");
  }

  return user.id;
}

export async function listBlocks(): Promise<ContentBlock[]> {
  const db = await readClient();
  const { data, error } = await db
    .from("content_blocks")
    .select(COLUMNS)
    .order("position", { ascending: true });

  if (error) {
    throw new Error("Unable to list content blocks.");
  }

  return (data ?? []).map((row) => mapBlock(row as Record<string, unknown>));
}

export async function listActiveBlocks(locale: "ar" | "en"): Promise<ContentBlock[]> {
  try {
    const db = await readClient();
    const { data, error } = await db
      .from("content_blocks")
      .select(COLUMNS)
      .eq("is_active", true)
      .in("locale", ["both", locale])
      .order("position", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => mapBlock(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getBlock(id: string): Promise<ContentBlock | null> {
  const db = await readClient();
  const { data, error } = await db
    .from("content_blocks")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load content block.");
  }

  return data ? mapBlock(data as Record<string, unknown>) : null;
}

export async function createBlock(input: unknown): Promise<ContentBlock> {
  const userId = await requireContentAdmin();
  const parsed = parseContentBlockInput(input);
  const db = writeClient();
  const { count } = await db
    .from("content_blocks")
    .select("id", { count: "exact", head: true });

  const { data, error } = await db
    .from("content_blocks")
    .insert({
      ...toRow(parsed),
      position: parsed.position ?? count ?? 0,
      created_by: userId,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Unable to create content block.");
  }

  return mapBlock(data as Record<string, unknown>);
}

export async function updateBlock(id: string, input: unknown): Promise<ContentBlock> {
  await requireContentAdmin();
  const parsed = parseContentBlockInput(input);
  const db = writeClient();
  const { data, error } = await db
    .from("content_blocks")
    .update(toRow(parsed))
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Unable to update content block.");
  }

  return mapBlock(data as Record<string, unknown>);
}

export async function deleteBlock(id: string): Promise<void> {
  await requireContentAdmin();
  const db = writeClient();
  const { error } = await db.from("content_blocks").delete().eq("id", id);
  if (error) {
    throw new Error("Unable to delete content block.");
  }
}

export async function reorderBlocks(ids: string[]): Promise<void> {
  await requireContentAdmin();
  const db = writeClient();
  const ordered = reorderBlockIds(ids);

  for (const item of ordered) {
    const { error } = await db
      .from("content_blocks")
      .update({ position: item.position })
      .eq("id", item.id);
    if (error) {
      throw new Error("Unable to reorder content blocks.");
    }
  }
}

function toRow(input: ContentBlockInput) {
  return {
    type: input.type,
    title: emptyToNull(input.title),
    description: emptyToNull(input.description),
    image_url: emptyToNull(input.image_url),
    video_url: emptyToNull(input.video_url),
    cta_label: emptyToNull(input.cta_label),
    cta_url: emptyToNull(input.cta_url),
    extra: input.extra ?? {},
    is_active: input.is_active ?? true,
    locale: input.locale ?? "both",
    ...(input.position === undefined ? {} : { position: input.position }),
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
