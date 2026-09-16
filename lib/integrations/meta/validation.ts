import { z } from "zod";

const PIXEL_ID_PATTERN = /^\d{5,20}$/;
const MAX_ACCESS_TOKEN_LENGTH = 512;

export const metaConnectionInputSchema = z.object({
  pixelId: z
    .string()
    .trim()
    .regex(PIXEL_ID_PATTERN, "invalid_pixel_id"),
  accessToken: z
    .string()
    .trim()
    .min(1, "missing_access_token")
    .max(MAX_ACCESS_TOKEN_LENGTH, "access_token_too_long"),
});

export type MetaConnectionInput = z.infer<typeof metaConnectionInputSchema>;

export function parseMetaConnectionInput(
  value: unknown,
):
  | { ok: true; value: MetaConnectionInput }
  | { ok: false; error: string } {
  const result = metaConnectionInputSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "invalid_input",
    };
  }

  return { ok: true, value: result.data };
}

export function maskPixelId(pixelId: string): string {
  const trimmed = pixelId.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `****${trimmed.slice(-4)}`;
}
