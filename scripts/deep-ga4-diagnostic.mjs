import { createDecipheriv, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
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

function decryptSecret(payload, secret) {
  const [version, ivPart, tagPart, dataPart] = payload.split(":");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart) {
    throw new Error("Encrypted secret has an unexpected format.");
  }
  const key = scryptSync(secret, "confirma-shopify-token", 32);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function redact(value, secret) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return raw
    .replace(/api_secret=[^&\s"]+/gi, "api_secret=[REDACTED]")
    .split(secret)
    .join("[REDACTED]");
}

function headerObject(headers, secret) {
  const output = {};
  headers.forEach((value, key) => {
    output[key] = redact(value, secret);
  });
  return output;
}

async function send(url, payload, secret) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : "";
  } catch {
    body = text;
  }
  return {
    status: response.status,
    headers: headerObject(response.headers, secret),
    body,
  };
}

const env = loadEnvLocal();
const supabase = createClient(
  requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const sessionSecret = requireEnv(env, "GOOGLE_SESSION_SECRET");

const { data: connections, error: connectionError } = await supabase
  .from("google_connections")
  .select("store_connection_id, conversion_id, verification_status");

if (connectionError || !connections?.length) {
  console.error("Unable to read google_connections.");
  console.error(connectionError?.message ?? "no rows");
  process.exit(1);
}

const { data: secrets, error: secretError } = await supabase
  .from("google_connection_secrets")
  .select("store_connection_id, encrypted_access_token");

if (secretError || !secrets?.length) {
  console.error("Unable to read google_connection_secrets.");
  console.error(secretError?.message ?? "no rows");
  process.exit(1);
}

const connection = connections[0];
const secretRow = secrets.find((row) => row.store_connection_id === connection.store_connection_id) ?? secrets[0];
const measurementId = connection.conversion_id;
const apiSecret = decryptSecret(secretRow.encrypted_access_token, sessionSecret);

const payload = {
  client_id: "9999999999.9999999999",
  events: [
    {
      name: "diag_test",
      params: {
        engagement_time_msec: 100,
        session_id: 9999999999999,
      },
    },
  ],
};

const collectUrl = new URL("https://www.google-analytics.com/mp/collect");
collectUrl.searchParams.set("measurement_id", measurementId);
collectUrl.searchParams.set("api_secret", apiSecret);

const debugUrl = new URL("https://www.google-analytics.com/debug/mp/collect");
debugUrl.searchParams.set("measurement_id", measurementId);
debugUrl.searchParams.set("api_secret", apiSecret);

console.log("CONNECTIONS");
console.log(JSON.stringify(connections.map((row) => ({
  store_connection_id: row.store_connection_id,
  measurement_id: row.conversion_id,
  verification_status: row.verification_status,
})), null, 2));
console.log(`encrypted_secret_length: ${secretRow.encrypted_access_token.length}`);
console.log(`api_secret_length: ${apiSecret.length}`);

const collect = await send(collectUrl, payload, apiSecret);
console.log("COLLECT");
console.log(JSON.stringify({
  status: collect.status,
  headers: collect.headers,
  body: collect.body,
}, null, 2));

const debug = await send(debugUrl, {
  ...payload,
  validation_behavior: "ENFORCE_RECOMMENDATIONS",
}, apiSecret);
console.log("DEBUG");
console.log(redact(JSON.stringify({
  status: debug.status,
  headers: debug.headers,
  body: debug.body,
}, null, 2), apiSecret));

const headersCheck = await send(collectUrl, payload, apiSecret);
const interesting = Object.entries(headersCheck.headers).filter(([key]) =>
  /google|ga4|analytics|x-|warning|error/i.test(key),
);
console.log("HEADER_CHECK");
console.log(JSON.stringify({
  status: headersCheck.status,
  interesting_headers: Object.fromEntries(interesting),
  all_header_names: Object.keys(headersCheck.headers),
  note: "GA4 does not expose whether an API secret is still active. A 2xx response does not prove the hit was recorded.",
}, null, 2));
