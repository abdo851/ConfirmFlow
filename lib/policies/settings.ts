import "server-only";

import { createDatabaseClient } from "@/lib/database/client";
import { requireContentAdmin } from "@/lib/content/blocks";

export interface PolicyCopy {
  title: string;
  body: string;
}

export type PolicyKey = "privacy" | "terms" | "refund" | "cookies";

export interface PolicyCatalog {
  en: Record<PolicyKey, PolicyCopy>;
  ar: Record<PolicyKey, PolicyCopy>;
}

const POLICY_KEYS: PolicyKey[] = ["privacy", "terms", "refund", "cookies"];

export function parsePolicyCatalog(value: unknown): PolicyCatalog | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const catalog = { en: {}, ar: {} } as PolicyCatalog;

  for (const locale of ["en", "ar"] as const) {
    const localeValue = record[locale];
    if (!localeValue || typeof localeValue !== "object") {
      return null;
    }
    for (const key of POLICY_KEYS) {
      const entry = (localeValue as Record<string, unknown>)[key];
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const title = (entry as { title?: unknown }).title;
      const body = (entry as { body?: unknown }).body;
      if (typeof title !== "string" || typeof body !== "string") {
        return null;
      }
      catalog[locale][key] = { title, body };
    }
  }

  return catalog;
}

export async function getPolicyOverrides(): Promise<PolicyCatalog | null> {
  try {
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("app_settings")
      .select("value")
      .eq("key", "policies")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return parsePolicyCatalog(data.value);
  } catch {
    return null;
  }
}

export async function savePolicyCatalog(value: unknown): Promise<void> {
  const catalog = parsePolicyCatalog(value);
  if (!catalog) {
    throw new Error("INVALID_POLICIES");
  }

  await requireContentAdmin();
  const db = createDatabaseClient();
  const { error } = await db.from("app_settings").upsert({
    key: "policies",
    value: catalog,
  });

  if (error) {
    throw new Error("Unable to save policies.");
  }
}
