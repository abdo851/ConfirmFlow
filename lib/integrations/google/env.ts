import { z } from "zod";

const googleEnvSchema = z.object({
  GOOGLE_SESSION_SECRET: z
    .string()
    .min(32, "GOOGLE_SESSION_SECRET must be at least 32 characters"),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().min(1).optional(),
});

export type GoogleEnv = z.infer<typeof googleEnvSchema>;

export function getGoogleEnv(): GoogleEnv {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();

  return googleEnvSchema.parse({
    GOOGLE_SESSION_SECRET: process.env.GOOGLE_SESSION_SECRET,
    GOOGLE_ADS_DEVELOPER_TOKEN: developerToken ? developerToken : undefined,
  });
}
