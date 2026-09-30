import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "https_required");

const shipmentPath = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^\/[^\s]*$/, "path_required");

const shared = {
  name: z.string().trim().min(1).max(120),
  active: z.boolean(),
};

export const customCarrierInputSchema = z.discriminatedUnion("connectionType", [
  z.object({
    ...shared,
    connectionType: z.literal("webhook"),
    webhookUrl: httpsUrl,
    signingSecret: z.string().trim().max(200).optional().or(z.literal("")),
  }),
  z.object({
    ...shared,
    connectionType: z.literal("api"),
    apiBaseUrl: httpsUrl,
    apiKey: z.string().trim().min(1).max(500).optional().or(z.literal("")),
    apiAuthType: z.enum(["bearer", "x-api-key", "basic"]),
    createShipmentPath: shipmentPath,
  }),
]);

export type CustomCarrierInput = z.infer<typeof customCarrierInputSchema>;

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}
