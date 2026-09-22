import { z } from "zod";

export const contentBlockTypes = ["banner", "video", "ad", "text"] as const;
export const contentLocales = ["both", "ar", "en"] as const;

export type ContentBlockType = (typeof contentBlockTypes)[number];
export type ContentLocale = (typeof contentLocales)[number];

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  extra: Record<string, unknown>;
  position: number;
  is_active: boolean;
  locale: ContentLocale;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const optionalText = z.string().trim().max(4000).optional().nullable();

export const contentBlockInputSchema = z.object({
  type: z.enum(contentBlockTypes),
  title: optionalText,
  description: optionalText,
  image_url: optionalText,
  video_url: optionalText,
  cta_label: z.string().trim().max(120).optional().nullable(),
  cta_url: optionalText,
  extra: z.record(z.string(), z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  locale: z.enum(contentLocales).optional(),
});

export type ContentBlockInput = z.infer<typeof contentBlockInputSchema>;

export function parseContentBlockInput(input: unknown): ContentBlockInput {
  return contentBlockInputSchema.parse(input);
}

export function reorderBlockIds(ids: string[]): { id: string; position: number }[] {
  const seen = new Set<string>();
  const ordered: { id: string; position: number }[] = [];

  for (const id of ids) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ordered.push({ id, position: ordered.length });
  }

  return ordered;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
