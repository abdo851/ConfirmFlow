import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  classifyMetaVerification,
  encryptAccessToken,
  redactSecrets,
  verificationTimestamp,
} from "./meta-script-lib.mjs";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";
const GRAPH_VERSION = "v21.0";

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

async function graphGet(path, accessToken, query = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

const env = loadEnvLocal();
const pixelId = requireEnv(process.env, "META_PIXEL_ID");
const accessToken = requireEnv(process.env, "META_ACCESS_TOKEN");
const sessionSecret = requireEnv(env, "META_SESSION_SECRET");
const supabase = createClient(requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL"), requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: stores, error: storesError } = await supabase.from("stores").select("id").eq("owner_id", USER_ID);
if (storesError || !stores?.length) {
  console.error("No store found for the test user.");
  process.exit(1);
}

const storeIds = stores.map((store) => store.id);
const { data: wooConnections, error: wooConnectionError } = await supabase
  .from("store_connections")
  .select("id, store_id")
  .in("store_id", storeIds)
  .eq("provider", "woocommerce");

if (wooConnectionError || !wooConnections?.length) {
  console.error("No WooCommerce store connection found for the test user.");
  process.exit(1);
}

const { data: wooRows, error: wooError } = await supabase
  .from("woocommerce_connections")
  .select("store_connection_id, store_url")
  .in("store_connection_id", wooConnections.map((row) => row.id));

if (wooError || !wooRows?.length) {
  console.error("No WooCommerce store URL found for the test user.");
  process.exit(1);
}

const woo = wooRows.find((row) => String(row.store_url).includes("ancientcoach")) ?? wooRows[0];
const storeId = wooConnections.find((row) => row.id === woo.store_connection_id)?.store_id;
if (!storeId) {
  console.error("WooCommerce store row is missing a store id.");
  process.exit(1);
}

const { data: storeConnection, error: connectionError } = await supabase
  .from("store_connections")
  .upsert(
    {
      store_id: storeId,
      connection_type: "marketing",
      provider: "meta",
      status: "connecting",
    },
    { onConflict: "store_id,connection_type,provider" },
  )
  .select("id")
  .single();

if (connectionError || !storeConnection) {
  console.error(redactSecrets(connectionError?.message ?? "Unable to save the Meta store connection."));
  process.exit(1);
}

const { error: metaError } = await supabase.from("meta_connections").upsert(
  {
    store_connection_id: storeConnection.id,
    pixel_id: pixelId,
    connected_at: new Date().toISOString(),
    verification_status: "unverified",
    verified_at: null,
    error_message: null,
  },
  { onConflict: "store_connection_id" },
);

if (metaError) {
  console.error(redactSecrets(metaError.message));
  process.exit(1);
}

const { error: secretError } = await supabase.from("meta_connection_secrets").upsert(
  {
    store_connection_id: storeConnection.id,
    encrypted_access_token: encryptAccessToken(accessToken, sessionSecret),
  },
  { onConflict: "store_connection_id" },
);

if (secretError) {
  console.error(redactSecrets(secretError.message));
  process.exit(1);
}

const me = await graphGet("me", accessToken, { fields: "id" });
const pixel = me.status === 200 ? await graphGet(pixelId, accessToken, { fields: "id" }) : { status: 0, body: null };
const graphMessage = pixel.body?.error?.message ?? me.body?.error?.message;
const result = classifyMetaVerification({
  meStatus: me.status,
  pixelStatus: pixel.status,
  pixelId,
  responsePixelId: pixel.body?.id,
});
if (!result.message && graphMessage) {
  result.message = redactSecrets(graphMessage);
}

const { error: verifyError } = await supabase
  .from("meta_connections")
  .update({
    verification_status: result.status,
    verified_at: verificationTimestamp(result.status),
    error_message: result.message ?? null,
  })
  .eq("store_connection_id", storeConnection.id);

if (verifyError) {
  console.error(redactSecrets(verifyError.message));
  process.exit(1);
}

if (result.status === "verified") {
  const { error: activeError } = await supabase
    .from("store_connections")
    .update({ status: "active" })
    .eq("id", storeConnection.id);
  if (activeError) {
    console.error(redactSecrets(activeError.message));
    process.exit(1);
  }
}

console.log(JSON.stringify({
  storeId,
  storeUrl: woo.store_url,
  storeConnectionId: storeConnection.id,
  verificationStatus: result.status,
  message: result.message ?? null,
  connectionStatus: result.status === "verified" ? "active" : "connecting",
}));

if (result.status !== "verified") {
  process.exit(1);
}
