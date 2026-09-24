import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";

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
  .select("id")
  .eq("owner_id", USER_ID);

if (storesError) {
  console.error(storesError.message);
  process.exit(1);
}

const storeIds = (stores ?? []).map((store) => store.id);
if (storeIds.length === 0) {
  console.log(JSON.stringify({ deleted: { secrets: [], connections: [], links: [] } }));
  process.exit(0);
}

const { data: links, error: linksError } = await supabase
  .from("store_connections")
  .select("id")
  .in("store_id", storeIds)
  .eq("connection_type", "marketing")
  .eq("provider", "meta");

if (linksError) {
  console.error(linksError.message);
  process.exit(1);
}

const connectionIds = (links ?? []).map((row) => row.id);
if (connectionIds.length === 0) {
  console.log(JSON.stringify({ deleted: { secrets: [], connections: [], links: [] } }));
  process.exit(0);
}

const { data: deletedSecrets, error: secretsError } = await supabase
  .from("meta_connection_secrets")
  .delete()
  .in("store_connection_id", connectionIds)
  .select("store_connection_id");

const { data: deletedConnections, error: connectionsError } = await supabase
  .from("meta_connections")
  .delete()
  .in("store_connection_id", connectionIds)
  .select("store_connection_id, pixel_id, verification_status");

const { data: deletedLinks, error: deleteLinksError } = await supabase
  .from("store_connections")
  .delete()
  .in("id", connectionIds)
  .eq("connection_type", "marketing")
  .eq("provider", "meta")
  .select("id, status");

if (secretsError || connectionsError || deleteLinksError) {
  console.error(secretsError?.message ?? connectionsError?.message ?? deleteLinksError?.message);
  process.exit(1);
}

console.log(
  JSON.stringify({
    deleted: {
      secrets: (deletedSecrets ?? []).map((row) => row.store_connection_id),
      connections: deletedConnections ?? [],
      links: deletedLinks ?? [],
    },
  }),
);
