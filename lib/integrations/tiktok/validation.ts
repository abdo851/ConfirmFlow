import { z } from "zod";

export const tiktokConnectionInputSchema = z.object({
  pixelCode: z.string().trim().min(5, "invalid_pixel_code"),
  accessToken: z.string().trim().min(10, "invalid_access_token"),
});

export type TikTokConnectionInput = z.infer<typeof tiktokConnectionInputSchema>;

export function parseTikTokConnectionInput(
  value: unknown,
): { ok: true; value: TikTokConnectionInput } | { ok: false; error: string } {
  const result = tiktokConnectionInputSchema.safeParse(value);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "invalid_input" };
  }

  return { ok: true, value: result.data };
}

export function maskPixelCode(pixelCode: string): string {
  const trimmed = pixelCode.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `****${trimmed.slice(-4)}`;
}
