import { z } from "zod";

const tiktokEnvSchema = z.object({
  TIKTOK_SESSION_SECRET: z
    .string()
    .min(32, "TIKTOK_SESSION_SECRET must be at least 32 characters"),
});

export type TikTokEnv = z.infer<typeof tiktokEnvSchema>;

export function getTikTokEnv(): TikTokEnv {
  return tiktokEnvSchema.parse({
    TIKTOK_SESSION_SECRET: process.env.TIKTOK_SESSION_SECRET,
  });
}
