import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import type { ConfirmationStatus } from "./types";
import type { ConfirmOrderActor, ConfirmOrderResult } from "./types";
import { canConfirm } from "./state-machine";

interface OrderConfirmationRow {
  id: string;
  owner_id: string;
  store_id: string;
  confirmation_status: ConfirmationStatus;
  confirmed_at: string | null;
}

async function getDatabaseClient(db?: SupabaseClient): Promise<SupabaseClient> {
  return db ?? createDatabaseClient();
}

async function loadOrderForConfirmation(
  db: SupabaseClient,
  orderId: string,
): Promise<OrderConfirmationRow | null> {
  const { data, error } = await db
    .from("orders")
    .select("id, owner_id, store_id, confirmation_status, confirmed_at")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load order for confirmation.");
  }

  return data as OrderConfirmationRow | null;
}

export async function confirmOrder(input: {
  orderId: string;
  actor: ConfirmOrderActor;
  db?: SupabaseClient;
  confirmedAt?: Date;
}): Promise<ConfirmOrderResult> {
  const db = await getDatabaseClient(input.db);
  const confirmedAt = (input.confirmedAt ?? new Date()).toISOString();

  const { data: updated, error: updateError } = await db
    .from("orders")
    .update({
      confirmation_status: "confirmed",
      confirmed_at: confirmedAt,
    })
    .eq("id", input.orderId)
    .eq("owner_id", input.actor.userId)
    .eq("confirmation_status", "pending")
    .select("id, confirmed_at")
    .maybeSingle();

  if (updateError) {
    throw new Error("Unable to confirm order.");
  }

  if (updated) {
    return {
      status: "confirmed",
      orderId: updated.id,
      confirmedAt: updated.confirmed_at ?? confirmedAt,
    };
  }

  const existing = await loadOrderForConfirmation(db, input.orderId);
  if (!existing) {
    return { status: "not_found" };
  }

  if (existing.owner_id !== input.actor.userId) {
    return { status: "forbidden" };
  }

  if (existing.confirmation_status === "confirmed") {
    return {
      status: "already_confirmed",
      orderId: existing.id,
      confirmedAt: existing.confirmed_at ?? undefined,
    };
  }

  if (!canConfirm(existing.confirmation_status)) {
    return { status: "invalid_state" };
  }

  return { status: "invalid_state" };
}
