import { z } from "zod";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export const googleConnectionInputSchema = z.object({
  measurementId: z
    .string()
    .trim()
    .regex(MEASUREMENT_ID_PATTERN, "invalid_measurement_id"),
  apiSecret: z.string().trim().min(20, "invalid_api_secret"),
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
