import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EMAIL = "merchant@confirma.local";
const PASSWORD = "Merchant1234!Confirma";

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

const { error } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: {
    full_name: "Test Merchant",
  },
});

if (error) {
  const message = `${error.code ?? ""} ${error.message ?? ""}`;
  const alreadyExists =
    error.code === "email_exists" ||
    message.toLowerCase().includes("email_exists") ||
    message.toLowerCase().includes("already been registered") ||
    message.toLowerCase().includes("already registered");

  if (alreadyExists) {
    console.log("Merchant user already exists — skipping creation.");
  } else {
    console.error(error);
    process.exit(1);
  }
} else {
  console.log("Merchant user created: " + EMAIL);
}

const { error: updateError } = await supabase
  .from("profiles")
  .update({ role: "user" })
  .eq("email", EMAIL);

if (updateError) {
  console.error(updateError);
  process.exit(1);
}

const { data: profile, error: readError } = await supabase
  .from("profiles")
  .select("id, email, role")
  .eq("email", EMAIL)
  .maybeSingle();

if (readError) {
  console.error(readError);
  process.exit(1);
}

console.log(
  `Profile: id=${profile?.id ?? "missing"} email=${profile?.email ?? "missing"} role=${profile?.role ?? "missing"}`,
);
console.log("Login at http://localhost:3000/ar/login");
console.log("Email: merchant@confirma.local");
console.log("Password: Merchant1234!Confirma");
