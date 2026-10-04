"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { withLocalePath } from "@/lib/i18n/paths";
import {
  canManagePlatformDomain,
  planPlatformDomainSave,
  type PlatformDomainRecord,
  type PlatformDomainStatus,
} from "@/lib/domain/platform-domain";

export type DomainActionResult = { ok: true } | { ok: false; error: string };

const DOMAIN_PAGE = "/dashboard/admin/settings/domain";

function refreshDomainPage() {
  revalidatePath(withLocalePath("en", DOMAIN_PAGE));
  revalidatePath(withLocalePath("ar", DOMAIN_PAGE));
}

async function adminDatabase() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }
  const db = await createUserDatabaseClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!canManagePlatformDomain(data?.role)) {
    return null;
  }
  return db;
}

function isStatus(value: string): value is PlatformDomainStatus {
  return (
    value === "setup_required" ||
    value === "pending_verification" ||
    value === "connected" ||
    value === "error"
  );
}

export async function getPlatformDomain(): Promise<PlatformDomainRecord | null> {
  const db = await adminDatabase();
  if (!db) {
    return null;
  }
  const { data, error } = await db
    .from("platform_domain_settings")
    .select("id, domain, status")
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const status = String(data.status);
  if (!isStatus(status)) {
    return null;
  }
  return { id: String(data.id), domain: String(data.domain), status };
}

export async function savePlatformDomainAction(formData: FormData): Promise<DomainActionResult> {
  const db = await adminDatabase();
  if (!db) {
    return { ok: false, error: "forbidden" };
  }

  const existing = await getPlatformDomain();
  const plan = planPlatformDomainSave(existing, String(formData.get("domain") ?? ""));
  if (!plan.ok) {
    return plan;
  }
  if (plan.action === "keep") {
    return { ok: true };
  }

  if (plan.action === "insert") {
    const { error } = await db.from("platform_domain_settings").insert({
      domain: plan.domain,
      status: plan.status,
    });
    if (error) {
      console.warn("platform_domain_save_failed");
      return { ok: false, error: "failed" };
    }
  } else {
    const { error } = await db
      .from("platform_domain_settings")
      .update({ domain: plan.domain, status: plan.status })
      .eq("id", plan.id);
    if (error) {
      console.warn("platform_domain_save_failed");
      return { ok: false, error: "failed" };
    }
  }

  refreshDomainPage();
  return { ok: true };
}

export async function removePlatformDomainAction(formData: FormData): Promise<DomainActionResult> {
  const db = await adminDatabase();
  if (!db) {
    return { ok: false, error: "forbidden" };
  }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false, error: "failed" };
  }
  const { error } = await db.from("platform_domain_settings").delete().eq("id", id);
  if (error) {
    console.warn("platform_domain_remove_failed");
    return { ok: false, error: "failed" };
  }
  refreshDomainPage();
  return { ok: true };
}
