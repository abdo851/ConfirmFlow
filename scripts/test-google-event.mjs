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

if (isDirectRun && !process.env.GOOGLE_EVENT_LOADER) {
  process.env.GOOGLE_EVENT_LOADER = "1";
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
    .select("id, confirmation_status, confirmed_at")
    .in(
      "store_id",
      stores.map((store) => store.id),
    )
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
    console.log("No confirmed order to test with");
    process.exit(0);
  }

  const deliveryModule = await import(
    pathToFileURL(join(root, "lib/integrations/google/delivery/deliver-purchase.ts")).href
  );
  const result = await deliveryModule.processGooglePurchaseDelivery({ order_id: order.id });

  const { data: row, error: rowError } = await supabase
    .from("google_conversion_deliveries")
    .select("status, attempts, last_error, response_body")
    .eq("order_id", order.id)
    .eq("event_type", "Purchase")
    .maybeSingle();

  console.log(`order_id: ${order.id}`);
  console.log(`delivery_result: ${result?.status ?? "null"}`);
  if (result?.message) {
    console.log(`message: ${result.message}`);
  }
  if (rowError) {
    console.log(`delivery_row_error: ${rowError.message}`);
  } else if (row) {
    console.log(`status: ${row.status}`);
    console.log(`attempts: ${row.attempts}`);
    console.log(`last_error: ${row.last_error ?? ""}`);
    console.log(`response_body: ${row.response_body ?? ""}`);
  } else {
    console.log("status: none");
  }
}
