import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { redactSecrets } from "./meta-script-lib.mjs";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";
const orderId = process.argv[2]?.trim();

function loadEnvLocal() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requireEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

if (!orderId) {
  console.error("Usage: npx vite-node --config vitest.config.ts scripts/retry-delivery-for-order.mjs <order-id>");
  process.exit(1);
}

loadEnvLocal();
const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: order, error: orderError } = await supabase
  .from("orders")
  .select("id, order_number")
  .eq("id", orderId)
  .eq("owner_id", USER_ID)
  .maybeSingle();

if (orderError || !order) {
  console.error(redactSecrets(orderError?.message ?? "Order was not found."));
  process.exit(1);
}

const { processMetaPurchaseDelivery } = await import(
  "../lib/integrations/meta/delivery/deliver-purchase.ts"
);
const outcome = await processMetaPurchaseDelivery({ orderId, userId: USER_ID });

const { data: delivery, error: deliveryError } = await supabase
  .from("meta_conversion_deliveries")
  .select("status, attempts, sent_at, last_error, event_id")
  .eq("order_id", orderId)
  .maybeSingle();

console.log(
  JSON.stringify({
    orderId: order.id,
    orderNumber: order.order_number,
    result: outcome?.status ?? "failed",
    eventId: outcome?.eventId ?? delivery?.event_id ?? null,
    lastError: delivery?.last_error ? redactSecrets(delivery.last_error) : null,
    attempts: delivery?.attempts ?? null,
    sentAt: delivery?.sent_at ?? null,
    deliveryError: deliveryError ? redactSecrets(deliveryError.message) : null,
  }),
);

if (outcome?.status !== "sent") {
  process.exit(1);
}
