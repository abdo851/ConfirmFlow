const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROVIDERS = new Set(["youcan", "shopify"]);

export interface WaitlistEntry {
  provider: "youcan" | "shopify";
  email: string;
}

export function validateWaitlistEntry(input: {
  provider: string;
  email: string;
}): { ok: true; entry: WaitlistEntry } | { ok: false; error: "invalid_provider" | "invalid_email" } {
  const provider = input.provider.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (!PROVIDERS.has(provider)) {
    return { ok: false, error: "invalid_provider" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  return {
    ok: true,
    entry: { provider: provider as WaitlistEntry["provider"], email },
  };
}
