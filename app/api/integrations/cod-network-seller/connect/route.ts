import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import { createCodeNetworkSellerClient } from "@/lib/integrations/cod-network-seller/client";
import { sealToken } from "@/lib/integrations/cod-network-seller/crypto";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const apiToken = readNonEmptyString(body, "apiToken");
  const webhookSecret = readNonEmptyString(body, "webhookSecret");
  if (!apiToken || !webhookSecret) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    await createCodeNetworkSellerClient({ apiToken }).listOrders({ limit: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("401")) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    console.warn("cod_network_seller_connect_test_failed");
    return NextResponse.json({ error: "connection_failed" }, { status: 502 });
  }

  try {
    const now = new Date().toISOString();
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("cod_network_connections")
      .upsert(
        {
          owner_id: user.id,
          store_id: null,
          api_token_encrypted: sealToken(apiToken),
          webhook_secret_encrypted: sealToken(webhookSecret),
          status: "active",
          last_tested_at: now,
          last_test_status: "ok",
          updated_at: now,
        },
        { onConflict: "owner_id" },
      )
      .select("id")
      .single();

    if (error || !data || typeof data.id !== "string") {
      console.warn("cod_network_seller_connect_persist_failed");
      return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, connectionId: data.id });
  } catch {
    console.warn("cod_network_seller_connect_persist_failed");
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }
}

function readNonEmptyString(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object" || !(key in body)) {
    return null;
  }
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}
