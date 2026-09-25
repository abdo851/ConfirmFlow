import { readFileSync, statSync } from "node:fs";
import { register } from "node:module";
import { createRequire } from "node:module";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href;

function resolveTsFile(parentUrl, specifier) {
  const parentPath = parentUrl ? fileURLToPath(parentUrl) : join(root, "scripts");
  const base = specifier.startsWith("@/")
    ? join(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? pathResolve(dirname(parentPath), specifier)
      : null;

  if (!base) {
    return null;
  }

  const candidates = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), base];
  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: pathToFileURL(join(root, "node_modules/server-only/empty.js")).href,
      shortCircuit: true,
    };
  }

  const file = resolveTsFile(context.parentURL, specifier);
  if (file) {
    return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: false,
      },
    }).outputText;

    return {
      format: "module",
      source,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}

function loadEnvLocal() {
  const content = readFileSync(pathResolve(root, ".env.local"), "utf8");
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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function redact(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return raw.replace(/api_secret=[^&\s"]+/gi, "api_secret=[REDACTED]");
}

if (isDirectRun && !process.env.GOOGLE_VERIFY_LOADER) {
  process.env.GOOGLE_VERIFY_LOADER = "1";
  process.env.GOOGLE_GA4_DEBUG_MODE = "1";
  register(import.meta.url);
  loadEnvLocal();

  const require = createRequire(import.meta.url);
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const ownerId = "61540ece-1244-4cf4-823a-7992af8c3420";
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    console.error("No store found for the admin user.");
    process.exit(1);
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, store_id, external_order_id, order_number, total_amount_minor, currency, confirmation_status")
    .in("store_id", stores.map((store) => store.id))
    .eq("confirmation_status", "confirmed")
    .order("confirmed_at", { ascending: false })
    .limit(1);

  if (ordersError) {
    console.error("Unable to read orders.");
    console.error(ordersError.message);
    process.exit(1);
  }

  const order = orders?.[0];
  if (!order) {
    console.log("No confirmed order to verify.");
    process.exit(0);
  }

  console.log("ORDER_FIELDS");
  console.log(JSON.stringify({
    id: order.id,
    store_id: order.store_id,
    external_order_id: order.external_order_id,
    order_number: order.order_number,
    total_amount_minor: order.total_amount_minor,
    currency: order.currency,
    confirmation_status: order.confirmation_status,
  }, null, 2));

  const payloadModule = await import(
    pathToFileURL(join(root, "lib/integrations/google/capi/payload-builder.ts")).href
  );
  const clientModule = await import(
    pathToFileURL(join(root, "lib/integrations/google/capi/client.ts")).href
  );
  const eligibilityModule = await import(
    pathToFileURL(join(root, "lib/integrations/google/delivery/eligibility.ts")).href
  );

  const eligibility = await eligibilityModule.loadEligibleGoogleConnectionForStore({
    storeId: order.store_id,
    db: supabase,
  });

  if (!eligibility.eligible) {
    console.log(`eligibility: ${eligibility.message}`);
    process.exit(1);
  }

  const payload = payloadModule.buildGA4Purchase({
    event_id: `google:purchase:${order.id}`,
    order: {
      id: order.id,
      external_order_id: order.external_order_id,
      order_number: order.order_number,
      currency: order.currency,
      total_amount_minor: order.total_amount_minor,
    },
  });

  console.log("PAYLOAD");
  console.log(JSON.stringify(payload, null, 2));
  console.log(`measurement_id: ${eligibility.connection.measurementId}`);
  console.log("endpoint: https://www.google-analytics.com/debug/mp/collect");

  const strictPayload = {
    ...payload,
    validation_behavior: "ENFORCE_RECOMMENDATIONS",
  };
  const result = await clientModule.sendGA4Event({
    measurement_id: eligibility.connection.measurementId,
    api_secret: eligibility.connection.apiSecret,
    event: strictPayload,
    debug: true,
  });

  console.log(`debug_http_status: ${result.status}`);
  console.log("DEBUG_RESPONSE");
  console.log(redact(JSON.stringify(result.body, null, 2)));

  const messages = Array.isArray(result.body?.validationMessages)
    ? result.body.validationMessages
    : null;
  if (result.status < 200 || result.status >= 300 || !messages || messages.length > 0) {
    process.exit(1);
  }
}
