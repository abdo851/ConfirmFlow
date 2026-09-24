import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";
const OLD_HOST = "ancientcoach.s2-tastewp.com";

function loadEnvLocal() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const env = {};
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
    env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const env = loadEnvLocal();
const supabase = createClient(
  requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: stores, error: storesError } = await supabase
  .from("stores")
  .select("id, external_store_id, status")
  .eq("owner_id", USER_ID)
  .eq("platform", "woocommerce");

if (storesError) {
  console.error(storesError.message);
  process.exit(1);
}

const oldStores = (stores ?? []).filter((store) =>
  String(store.external_store_id ?? "").includes(OLD_HOST),
);
const storeIds = oldStores.map((store) => store.id);

if (storeIds.length === 0) {
  console.log(JSON.stringify({ deleted: {}, keptStore: true, reason: "no_old_store" }));
  process.exit(0);
}

const { data: wooLinks, error: wooLinksError } = await supabase
  .from("store_connections")
  .select("id, provider, connection_type")
  .in("store_id", storeIds)
  .eq("provider", "woocommerce");

if (wooLinksError) {
  console.error(wooLinksError.message);
  process.exit(1);
}

const wooConnectionIds = (wooLinks ?? []).map((row) => row.id);

const { data: metaLinks, error: metaLinksError } = await supabase
  .from("store_connections")
  .select("id, provider, connection_type")
  .in("store_id", storeIds)
  .eq("provider", "meta");

if (metaLinksError) {
  console.error(metaLinksError.message);
  process.exit(1);
}

let deletedSecrets = [];
let deletedWoo = [];
if (wooConnectionIds.length > 0) {
  const secrets = await supabase
    .from("woocommerce_connection_secrets")
    .delete()
    .in("store_connection_id", wooConnectionIds)
    .select("store_connection_id");
  const woo = await supabase
    .from("woocommerce_connections")
    .delete()
    .in("store_connection_id", wooConnectionIds)
    .select("store_connection_id, store_url");
  if (secrets.error || woo.error) {
    console.error(secrets.error?.message ?? woo.error?.message);
    process.exit(1);
  }
  deletedSecrets = secrets.data ?? [];
  deletedWoo = woo.data ?? [];
}

const events = await supabase
  .from("store_webhook_events")
  .delete()
  .in("store_id", storeIds)
  .select("id");
const orders = await supabase.from("orders").delete().in("store_id", storeIds).select("id");
const links = wooConnectionIds.length
  ? await supabase
      .from("store_connections")
      .delete()
      .in("id", wooConnectionIds)
      .eq("provider", "woocommerce")
      .select("id")
  : { data: [], error: null };

if (events.error || orders.error || links.error) {
  console.error(events.error?.message ?? orders.error?.message ?? links.error?.message);
  process.exit(1);
}

const metaStillThere = (metaLinks ?? []).length > 0;
let deletedStores = [];
let keptStoreReason = null;
if (!metaStillThere) {
  const removedStores = await supabase.from("stores").delete().in("id", storeIds).select("id, external_store_id");
  if (removedStores.error) {
    console.error(removedStores.error.message);
    process.exit(1);
  }
  deletedStores = removedStores.data ?? [];
} else {
  keptStoreReason =
    "stores row kept because the verified Meta connection uses a store_connection on this store, and deleting the store would cascade-delete Meta";
}

console.log(
  JSON.stringify({
    deleted: {
      secrets: deletedSecrets.map((row) => row.store_connection_id),
      woocommerceConnections: deletedWoo,
      webhookEvents: (events.data ?? []).map((row) => row.id),
      orders: (orders.data ?? []).map((row) => row.id),
      storeConnections: (links.data ?? []).map((row) => row.id),
      stores: deletedStores,
    },
    keptStore: metaStillThere,
    keptStoreReason,
    metaStoreConnections: metaLinks ?? [],
  }),
);
