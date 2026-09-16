import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabasePublicEnv,
  hasSupabasePublicEnv,
} from "@/lib/validation/env";

const ORIGINAL_ENV = { ...process.env };

describe("Supabase configuration", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("detects missing Supabase environment variables", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(hasSupabasePublicEnv()).toBe(false);
  });

  it("parses required Supabase public environment variables", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    const env = getSupabasePublicEnv();

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
      "test-publishable-key",
    );
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("rejects invalid Supabase URL values", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    expect(() => getSupabasePublicEnv()).toThrow();
  });
});
