import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { toPublicCarrier, type CustomCarrierPublic, type CustomCarrierRow } from "./public";
import { customCarrierInputSchema, type CustomCarrierInput } from "./schema";
import { sealValue } from "./seal";

export type { CustomCarrierPublic };

const PUBLIC_COLUMNS =
  "id, owner_id, name, connection_type, status, created_at, webhook_url, api_base_url, api_auth_type, create_shipment_path, hmac_secret_encrypted, api_key_encrypted";

async function requireUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

export async function listCustomCarriers(): Promise<CustomCarrierPublic[]> {
  const ownerId = await requireUserId();
  if (!ownerId) {
    return [];
  }
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("custom_shipping_connections")
    .select(PUBLIC_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error("custom_shipping_unavailable");
  }
  return (data ?? [])
    .filter((row) => row.owner_id === ownerId)
    .map((row) => toPublicCarrier(row as CustomCarrierRow));
}

export async function saveCustomCarrier(
  input: unknown,
  id?: string,
): Promise<{ ok: true; carrier: CustomCarrierPublic } | { ok: false; error: string }> {
  const ownerId = await requireUserId();
  if (!ownerId) {
    return { ok: false, error: "unauthorized" };
  }
  const parsed = customCarrierInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }
  const value = parsed.data;
  if (value.connectionType === "api" && !id && !value.apiKey) {
    return { ok: false, error: "invalid" };
  }

  const db = await createUserDatabaseClient();
  const patch = buildPatch(value, ownerId);
  if (id) {
    const { data, error } = await db
      .from("custom_shipping_connections")
      .update({ ...patch, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select(PUBLIC_COLUMNS)
      .maybeSingle();
    if (error || !data || data.owner_id !== ownerId) {
      return { ok: false, error: "save_failed" };
    }
    return { ok: true, carrier: toPublicCarrier(data as CustomCarrierRow) };
  }

  const { data, error } = await db
    .from("custom_shipping_connections")
    .insert(patch as Record<string, unknown>)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();
  if (error || !data || data.owner_id !== ownerId) {
    return { ok: false, error: "save_failed" };
  }
  return { ok: true, carrier: toPublicCarrier(data as CustomCarrierRow) };
}

function buildPatch(value: CustomCarrierInput, ownerId: string) {
  const status = value.active ? "active" : "inactive";
  if (value.connectionType === "webhook") {
    const secret = value.signingSecret?.trim();
    return {
      owner_id: ownerId,
      name: value.name,
      connection_type: "webhook" as const,
      webhook_url: value.webhookUrl,
      ...(secret ? { hmac_secret_encrypted: sealValue(secret) } : {}),
      api_base_url: null,
      api_auth_type: null,
      create_shipment_path: null,
      status,
    };
  }
  const apiKey = value.apiKey?.trim();
  return {
    owner_id: ownerId,
    name: value.name,
    connection_type: "api" as const,
    webhook_url: null,
    api_base_url: value.apiBaseUrl,
    ...(apiKey ? { api_key_encrypted: sealValue(apiKey) } : {}),
    api_auth_type: value.apiAuthType,
    create_shipment_path: value.createShipmentPath,
    status,
  };
}

export async function setCustomCarrierStatus(
  id: string,
  status: "active" | "inactive",
): Promise<{ ok: true; carrier: CustomCarrierPublic } | { ok: false; error: string }> {
  const ownerId = await requireUserId();
  if (!ownerId) {
    return { ok: false, error: "unauthorized" };
  }
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("custom_shipping_connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();
  if (error || !data || data.owner_id !== ownerId) {
    return { ok: false, error: "save_failed" };
  }
  return { ok: true, carrier: toPublicCarrier(data as CustomCarrierRow) };
}

export async function deleteCustomCarrier(id: string): Promise<{ ok: boolean; error?: string }> {
  const ownerId = await requireUserId();
  if (!ownerId) {
    return { ok: false, error: "unauthorized" };
  }
  const db = await createUserDatabaseClient();
  const { error } = await db.from("custom_shipping_connections").delete().eq("id", id).eq("owner_id", ownerId);
  if (error) {
    return { ok: false, error: "save_failed" };
  }
  return { ok: true };
}
