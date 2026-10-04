import { NextResponse } from "next/server";
import { createDatabaseClient } from "@/lib/database/client";
import { dispatchEvent } from "@/lib/foundation/event-router";
import { unsealToken } from "@/lib/integrations/cod-network-seller/crypto";
import {
  mapStatusToEventType,
  parseWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/integrations/cod-network-seller/webhook-handler";
import type { CodeNetworkSellerWebhookPayload } from "@/lib/integrations/cod-network-seller/types";

type ConnectionRow = {
  id: string;
  owner_id: string;
  webhook_secret_encrypted: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ connectionId: string }> },
) {
  const { connectionId } = await context.params;
  if (!connectionId) {
    return NextResponse.json({ error: "missing_connection_id" }, { status: 400 });
  }

  const rawBody = await request.text();
  const headerValue = request.headers.get("seller-secret-key");

  let connection: ConnectionRow;
  try {
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("cod_network_connections")
      .select("id, owner_id, webhook_secret_encrypted")
      .eq("id", connectionId)
      .maybeSingle();

    if (error || !data || typeof data.owner_id !== "string" || typeof data.webhook_secret_encrypted !== "string") {
      return NextResponse.json({ error: "connection_not_found" }, { status: 404 });
    }
    connection = {
      id: typeof data.id === "string" ? data.id : connectionId,
      owner_id: data.owner_id,
      webhook_secret_encrypted: data.webhook_secret_encrypted,
    };
  } catch {
    console.warn("cod_network_seller_webhook_lookup_failed");
    return NextResponse.json({ error: "connection_not_found" }, { status: 404 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = unsealToken(connection.webhook_secret_encrypted);
  } catch {
    console.warn("cod_network_seller_webhook_unseal_failed");
    return NextResponse.json({ error: "connection_failed" }, { status: 500 });
  }

  if (!verifyWebhookSignature({ rawBody, headerValue, webhookSecret })) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const externalId = externalIdFrom(payload);
  if (!externalId) {
    return NextResponse.json({ error: "missing_external_id" }, { status: 400 });
  }

  const eventType = hasLeadId(payload) ? "lead_status" : "order_status";

  let eventRowId: string;
  try {
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("cod_network_webhook_events")
      .insert({
        owner_id: connection.owner_id,
        connection_id: connectionId,
        event_type: eventType,
        external_id: externalId,
        signature_valid: true,
        payload,
        processed_at: null,
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    if (error || !data || typeof data.id !== "string") {
      console.warn("cod_network_seller_webhook_insert_failed");
      return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }
    eventRowId = data.id;
  } catch {
    console.warn("cod_network_seller_webhook_insert_failed");
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  const mapped = mapStatusToEventType(payload.status);
  if (!mapped) {
    await markProcessed(eventRowId);
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await dispatchEvent({
      ownerId: connection.owner_id,
      orderId: null,
      type: mapped,
      source: "cod_network_seller",
      payload: {
        external_id: externalId,
        status: payload.status,
        connection_id: connectionId,
      },
    });
  } catch {
    console.warn("cod_network_seller_webhook_dispatch_failed");
  }

  await markProcessed(eventRowId);
  return NextResponse.json({ ok: true });
}

function hasLeadId(payload: CodeNetworkSellerWebhookPayload): boolean {
  return payload.lead_id !== undefined && payload.lead_id !== null && String(payload.lead_id).length > 0;
}

function externalIdFrom(payload: CodeNetworkSellerWebhookPayload): string | null {
  if (typeof payload.subid === "string" && payload.subid.trim().length > 0) {
    return payload.subid.trim();
  }
  if (hasLeadId(payload)) {
    return String(payload.lead_id);
  }
  return null;
}

async function markProcessed(eventRowId: string): Promise<void> {
  try {
    const db = createDatabaseClient();
    const { error } = await db
      .from("cod_network_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", eventRowId);
    if (error) {
      console.warn("cod_network_seller_webhook_process_mark_failed");
    }
  } catch {
    console.warn("cod_network_seller_webhook_process_mark_failed");
  }
}
