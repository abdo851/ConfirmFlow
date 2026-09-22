import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import type {
  ConfirmationStatus,
  ConfirmOrderActor,
  ConfirmOrderResult,
} from "./types";

export function canConfirm(status: ConfirmationStatus): boolean {
  return status === "pending";
}

export function canReject(status: ConfirmationStatus): boolean {
  return status === "pending";
}

export function canArchive(status: ConfirmationStatus): boolean {
  return status === "confirmed" || status === "rejected";
}

export function isValidConfirmationTransition(
  from: ConfirmationStatus,
  to: ConfirmationStatus,
): boolean {
  if (from === "pending" && (to === "confirmed" || to === "rejected")) {
    return true;
  }

  if ((from === "confirmed" || from === "rejected") && to === "archived") {
    return true;
  }

  return false;
}

interface OrderStatusRow {
  id: string;
  owner_id: string;
  confirmation_status: ConfirmationStatus;
}

async function getDatabaseClient(db?: SupabaseClient): Promise<SupabaseClient> {
  return db ?? createDatabaseClient();
}

async function loadOrderStatus(
  db: SupabaseClient,
  orderId: string,
): Promise<OrderStatusRow | null> {
  const { data, error } = await db
    .from("orders")
    .select("id, owner_id, confirmation_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load order status.");
  }

  return data as OrderStatusRow | null;
}

async function applyStatusChange(input: {
  orderId: string;
  actor: ConfirmOrderActor;
  fromStatuses: ConfirmationStatus[];
  to: "rejected" | "archived";
  db?: SupabaseClient;
}): Promise<ConfirmOrderResult> {
  const db = await getDatabaseClient(input.db);
  const filtered = db
    .from("orders")
    .update({ confirmation_status: input.to })
    .eq("id", input.orderId)
    .eq("owner_id", input.actor.userId);

  const statusQuery =
    input.fromStatuses.length === 1
      ? filtered.eq("confirmation_status", input.fromStatuses[0])
      : filtered.in("confirmation_status", input.fromStatuses);

  const { data: updated, error: updateError } = await statusQuery
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error("Unable to update order status.");
  }

  if (updated) {
    return { status: input.to, orderId: updated.id };
  }

  const existing = await loadOrderStatus(db, input.orderId);
  if (!existing) {
    return { status: "not_found" };
  }

  if (existing.owner_id !== input.actor.userId) {
    return { status: "forbidden" };
  }

  return { status: "invalid_state" };
}

export async function rejectOrder(input: {
  orderId: string;
  actor: ConfirmOrderActor;
  db?: SupabaseClient;
}): Promise<ConfirmOrderResult> {
  return applyStatusChange({
    orderId: input.orderId,
    actor: input.actor,
    fromStatuses: ["pending"],
    to: "rejected",
    db: input.db,
  });
}

export async function archiveOrder(input: {
  orderId: string;
  actor: ConfirmOrderActor;
  db?: SupabaseClient;
}): Promise<ConfirmOrderResult> {
  return applyStatusChange({
    orderId: input.orderId,
    actor: input.actor,
    fromStatuses: ["confirmed", "rejected"],
    to: "archived",
    db: input.db,
  });
}
