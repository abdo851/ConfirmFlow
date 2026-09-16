import { z } from "zod";

const ISO4217_PATTERN = /^[A-Z]{3}$/;

export const conversionUserDataSchema = z.object({
  email: z.union([z.string().email(), z.null()]).optional(),
  phone: z.union([z.string().min(1), z.null()]).optional(),
});

export const conversionCustomDataSchema = z.object({
  currency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => ISO4217_PATTERN.test(value), "invalid_currency"),
  valueMinor: z.number().int().nonnegative(),
});

export const conversionEventSchema = z.object({
  eventName: z.literal("Purchase"),
  eventId: z.string().trim().min(1),
  eventTime: z.number().int().positive(),
  actionSource: z.literal("server"),
  userData: conversionUserDataSchema,
  customData: conversionCustomDataSchema,
});

export type ValidatedConversionEvent = z.infer<typeof conversionEventSchema>;

export function validateConversionEvent(
  event: unknown,
):
  | { ok: true; value: ValidatedConversionEvent }
  | { ok: false; error: string } {
  const result = conversionEventSchema.safeParse(event);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: issue?.message ?? "invalid_conversion_event" };
  }

  return { ok: true, value: result.data };
}
