import { z } from "zod";

export const googleConnectionInputSchema = z.object({
  conversionId: z.string().trim().min(3, "invalid_conversion_id"),
  conversionLabel: z.string().trim().min(1, "invalid_conversion_label"),
  accessToken: z.string().trim().min(10, "invalid_access_token"),
});

export type GoogleConnectionInput = z.infer<typeof googleConnectionInputSchema>;

export function parseGoogleConnectionInput(
  value: unknown,
): { ok: true; value: GoogleConnectionInput } | { ok: false; error: string } {
  const result = googleConnectionInputSchema.safeParse(value);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "invalid_input" };
  }

  return { ok: true, value: result.data };
}

export function maskConversionId(conversionId: string): string {
  const trimmed = conversionId.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `****${trimmed.slice(-4)}`;
}

/** Google Ads customer ids are numeric. AW-123 style ids keep the digits. */
export function googleCustomerId(conversionId: string): string {
  const trimmed = conversionId.trim();
  const prefixed = /^AW-(\d+)$/i.exec(trimmed);
  return prefixed?.[1] ?? trimmed;
}
