import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { resolveLoginFlow } from "@/lib/auth/login-flow";
import { resolveSignupFlow } from "@/lib/auth/signup-flow";
import {
  GOOGLE_OAUTH_PROVIDER,
  GOOGLE_SIGNUP_DESTINATION,
  buildGoogleOAuthRedirectUrl,
  requestGoogleOAuth,
  resolveAuthCallbackFailure,
} from "@/lib/auth/google-oauth";

const root = path.resolve(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Google OAuth initiation", () => {
  it("requests the google provider and returns success without an error", async () => {
    const calls: Array<{ provider: string; options: { redirectTo: string } }> = [];
    const started = await requestGoogleOAuth(async (request) => {
      calls.push(request);
      return { error: null };
    }, "https://app.example.com/api/auth/callback?next=%2Fonboarding");

    expect(started).toBe(true);
    expect(calls).toEqual([
      {
        provider: GOOGLE_OAUTH_PROVIDER,
        options: {
          redirectTo: "https://app.example.com/api/auth/callback?next=%2Fonboarding",
        },
      },
    ]);
    expect(GOOGLE_OAUTH_PROVIDER).toBe("google");
  });

  it("reports initiation failure without throwing", async () => {
    const started = await requestGoogleOAuth(async () => ({ error: { name: "AuthError" } }), "https://app.example.com/api/auth/callback");
    expect(started).toBe(false);
  });

  it("sends signup through the existing callback toward the dashboard", () => {
    const redirectTo = buildGoogleOAuthRedirectUrl(
      "https://app.example.com",
      GOOGLE_SIGNUP_DESTINATION,
      GOOGLE_SIGNUP_DESTINATION,
      "signup",
    );
    const url = new URL(redirectTo);

    expect(url.origin).toBe("https://app.example.com");
    expect(url.pathname).toBe("/api/auth/callback");
    expect(url.searchParams.get("next")).toBe("/dashboard");
    expect(url.searchParams.get("oauth")).toBe("google");
    expect(url.searchParams.get("from")).toBe("signup");
    expect(url.pathname).not.toContain("/en/");
    expect(url.pathname).not.toContain("/ar/");
  });

  it("preserves a safe login next path and rejects an external one", () => {
    const safe = new URL(
      buildGoogleOAuthRedirectUrl(
        "https://app.example.com/",
        "/dashboard/orders?tab=open",
        "/dashboard",
        "login",
      ),
    );
    expect(safe.searchParams.get("next")).toBe("/dashboard/orders?tab=open");
    expect(safe.searchParams.get("from")).toBe("login");

    const unsafe = new URL(
      buildGoogleOAuthRedirectUrl(
        "https://app.example.com",
        "https://evil.example.com",
        "/dashboard",
        "login",
      ),
    );
    expect(unsafe.searchParams.get("next")).toBe("/dashboard");
    expect(unsafe.searchParams.get("from")).toBe("login");
  });
});

describe("auth callback compatibility", () => {
  it("keeps a missing email-confirmation code on the existing login error", () => {
    expect(
      resolveAuthCallbackFailure({
        oauth: null,
        from: null,
        error: null,
      }),
    ).toEqual({ path: "/login", error: "auth_required" });
  });

  it("keeps a failed email-confirmation exchange on the existing login error", () => {
    expect(
      resolveAuthCallbackFailure({
        oauth: null,
        from: null,
        error: null,
        exchangeFailed: true,
      }),
    ).toEqual({ path: "/login", error: "auth_required" });
  });

  it("maps Google cancellation and failure back to the page that started them", () => {
    expect(
      resolveAuthCallbackFailure({
        oauth: "google",
        from: "signup",
        error: "access_denied",
      }),
    ).toEqual({ path: "/signup", error: "google_cancelled" });

    expect(
      resolveAuthCallbackFailure({
        oauth: "google",
        from: "login",
        error: "server_error",
      }),
    ).toEqual({ path: "/login", error: "google_failed" });

    expect(
      resolveAuthCallbackFailure({
        oauth: "google",
        from: "https://evil.example.com",
        error: "access_denied",
      }),
    ).toEqual({ path: "/login", error: "google_cancelled" });
  });
});

describe("Google buttons and email/password preservation", () => {
  it("enables Google on signup without collecting username or submitting the email form", () => {
    const signup = readSource("components/auth/signup-form.tsx");
    const button = readSource("components/auth/google-sign-in-button.tsx");

    expect(signup).toContain("GoogleSignInButton");
    expect(signup).toContain('origin="signup"');
    expect(signup).toContain("GOOGLE_SIGNUP_DESTINATION");
    expect(signup).not.toContain("googleNote");
    expect(signup).not.toContain("disabled\n");
    expect(button).toContain('type="button"');
    expect(button).toContain("signInWithOAuth");
    expect(button).not.toContain("Coming soon");
  });

  it("enables Google on login and passes the current next path", () => {
    const login = readSource("components/auth/login-form.tsx");

    expect(login).toContain("GoogleSignInButton");
    expect(login).toContain('origin="login"');
    expect(login).toContain("nextPath={nextPath}");
    expect(login).toContain('fallback="/dashboard"');
    expect(login).toContain("signInWithPassword");
    expect(login).not.toContain("googleNote");
  });

  it("leaves email and password server actions unchanged", () => {
    const actions = readSource("lib/auth/actions.ts");

    expect(actions).toContain("signInWithPassword");
    expect(actions).toContain("signUp");
    expect(actions).not.toContain("signInWithOAuth");
    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: true,
        authError: false,
        hasSession: true,
        hasUser: true,
      }),
    ).toEqual({ type: "redirect", path: "/onboarding" });
    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: false,
        next: "/dashboard/orders",
      }),
    ).toEqual({ type: "redirect", path: "/dashboard/orders" });
  });
});
