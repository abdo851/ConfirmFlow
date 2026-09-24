import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildMetaRelinkPlan } from "../lib/integrations/meta/relink.ts";

const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";
const NEW_STORE_ID = "9e1d1728-8146-447f-b8cd-51b4bb5d74ea";
const EXPECTED_PIXEL_ID = "4444157855871429";

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
    env[key] = process.env[key] || value;
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

const env = loadEnvLocal();
const supabase = createClient(
  requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: store, error: storeError } = await supabase
  .from("stores")
  .select("id, owner_id")
  .eq("id", NEW_STORE_ID)
  .maybeSingle();

if (storeError || !store || store.owner_id !== USER_ID) {
  fail("New WooCommerce store was not found for the test user.");
}

const { data: metaRows, error: metaError } = await supabase
  .from("meta_connections")
  .select("store_connection_id, pixel_id, verification_status");

if (metaError || !metaRows?.length) {
  fail("No Meta connection found to re-link.");
}

if (metaRows.length !== 1) {
  fail("Expected exactly one Meta connection.");
}

const current = metaRows[0];
if (current.pixel_id !== EXPECTED_PIXEL_ID) {
  fail("Meta connection pixel does not match the expected pixel.");
}

const { data: secret, error: secretError } = await supabase
  .from("meta_connection_secrets")
  .select("encrypted_access_token")
  .eq("store_connection_id", current.store_connection_id)
  .maybeSingle();

if (secretError || !secret?.encrypted_access_token) {
  fail("Encrypted Meta access token is missing.");
}

let plan;
try {
  plan = buildMetaRelinkPlan({
    source: {
      storeConnectionId: current.store_connection_id,
      pixelId: current.pixel_id,
      encryptedAccessToken: secret.encrypted_access_token,
    },
    newStoreId: NEW_STORE_ID,
    now: new Date().toISOString(),
  });
} catch {
  fail("Encrypted token cannot be copied without re-encrypting. Stopped.");
}

const { error: deleteSecretError } = await supabase
  .from("meta_connection_secrets")
  .delete()
  .eq("store_connection_id", plan.deleteStoreConnectionId);

if (deleteSecretError) {
  fail("Unable to delete the old Meta secret.");
}

const { error: deleteMetaError } = await supabase
  .from("meta_connections")
  .delete()
  .eq("store_connection_id", plan.deleteStoreConnectionId);

if (deleteMetaError) {
  fail("Unable to delete the old Meta connection.");
}

const { error: deleteLinkError } = await supabase
  .from("store_connections")
  .delete()
  .eq("id", plan.deleteStoreConnectionId);

if (deleteLinkError) {
  fail("Unable to delete the old Meta store connection.");
}

const { data: createdLink, error: createLinkError } = await supabase
  .from("store_connections")
  .insert(plan.storeConnection)
  .select("id")
  .single();

if (createLinkError || !createdLink) {
  fail("Unable to create the new Meta store connection.");
}

const { error: createMetaError } = await supabase.from("meta_connections").insert({
  store_connection_id: createdLink.id,
  ...plan.metaConnection,
});

if (createMetaError) {
  fail("Unable to create the new Meta connection.");
}

const { error: createSecretError } = await supabase
  .from("meta_connection_secrets")
  .insert({
    store_connection_id: createdLink.id,
    encrypted_access_token: plan.secret.encrypted_access_token,
  });

if (createSecretError) {
  fail("Unable to copy the encrypted Meta access token.");
}

console.log(
  JSON.stringify(
    {
      deletedStoreConnectionId: plan.deleteStoreConnectionId,
      newStoreConnectionId: createdLink.id,
      newStoreId: NEW_STORE_ID,
      pixelId: plan.metaConnection.pixel_id,
      verificationStatus: plan.metaConnection.verification_status,
      tokenCopied: true,
      tokenLength: plan.secret.encrypted_access_token.length,
    },
    null,
    2,
  ),
);
