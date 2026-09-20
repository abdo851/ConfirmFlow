import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_EMAIL = "test@confirma.local";
const TEST_PASSWORD = "Test1234!Confirma";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
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

const env = loadEnvLocal();
const supabaseUrl = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.createUser({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  email_confirm: true,
  user_metadata: {
    full_name: "Test User",
  },
});

if (error) {
  const message = error.message ?? "";
  const isExistingUser =
    error.code === "email_exists" ||
    message.toLowerCase().includes("already been registered") ||
    message.toLowerCase().includes("already registered");

  if (isExistingUser) {
    console.log("Test user already exists — skipping creation.");
  } else {
    console.error("Failed to create test user:", error);
    process.exit(1);
  }
} else {
  console.log(`Test user created: ${TEST_EMAIL}`);
  if (data?.user?.id) {
    console.log(`User ID: ${data.user.id}`);
  }
}

console.log(
  "Password: Test1234!Confirma (change by editing scripts/seed-test-user.mjs)",
);
