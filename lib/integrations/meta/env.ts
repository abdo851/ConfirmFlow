import { z } from "zod";

const metaEnvSchema = z.object({
  META_SESSION_SECRET: z
    .string()
    .min(32, "META_SESSION_SECRET must be at least 32 characters"),
});

export type MetaEnv = z.infer<typeof metaEnvSchema>;

export function getMetaEnv(): MetaEnv {
  return metaEnvSchema.parse(process.env);
}
