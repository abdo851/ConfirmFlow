import { describe, expect, it } from "vitest";
import { resolveLoginFlow } from "@/lib/auth/login-flow";
import { resolveSafeInternalRedirect } from "@/lib/auth/redirects";
import { resolveSignupFlow } from "@/lib/auth/signup-flow";
import {
  isProtectedAppPath,
  isProtectedMetaApiPath,
  isProtectedShopifyApiPath,
} from "@/lib/auth/protection";
import { buildAuthCallbackUrl } from "@/lib/config/app-url";

describe("resolveSafeInternalRedirect", () => {
  it("uses the default destination when next is missing", () => {
    expect(resolveSafeInternalRedirect(null)).toBe("/dashboard");
    expect(resolveSafeInternalRedirect(undefined)).toBe("/dashboard");
    expect(resolveSafeInternalRedirect("")).toBe("/dashboard");
  });

  it("allows safe internal relative paths", () => {
    expect(resolveSafeInternalRedirect("/dashboard/orders")).toBe(
      "/dashboard/orders",
    );
    expect(resolveSafeInternalRedirect("/en/dashboard/connections")).toBe(
      "/en/dashboard/connections",
    );
    expect(resolveSafeInternalRedirect("/onboarding/store")).toBe(
      "/onboarding/store",
    );
  });

  it("rejects external and malformed next values", () => {
    expect(resolveSafeInternalRedirect("https://evil.example.com")).toBe(
      "/dashboard",
    );
    expect(resolveSafeInternalRedirect("//evil.example.com")).toBe("/dashboard");
    expect(resolveSafeInternalRedirect("/\\evil.example.com")).toBe("/dashboard");
    expect(resolveSafeInternalRedirect("/login@evil.example.com")).toBe(
      "/dashboard",
    );
    expect(resolveSafeInternalRedirect("/dashboard/../admin")).toBe("/dashboard");
  });
});

describe("resolveSignupFlow", () => {
  it("redirects to onboarding when signup returns a session", () => {
    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: true,
        authError: false,
        hasSession: true,
        hasUser: true,
      }),
    ).toEqual({ type: "redirect", path: "/onboarding" });
  });

  it("requires email confirmation when signup succeeds without a session", () => {
    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: true,
        authError: false,
        hasSession: false,
        hasUser: true,
      }),
    ).toEqual({ type: "confirm_email" });
  });

  it("returns signup errors for invalid signup results", () => {
    expect(
      resolveSignupFlow({
        hasRequiredFields: false,
        passwordsMatch: true,
        authError: false,
        hasSession: false,
        hasUser: false,
      }),
    ).toEqual({ type: "error", code: "missing_fields" });

    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: false,
        authError: false,
        hasSession: false,
        hasUser: false,
      }),
    ).toEqual({ type: "error", code: "password_mismatch" });

    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: true,
        authError: true,
        hasSession: false,
        hasUser: false,
      }),
    ).toEqual({ type: "error", code: "signup_failed" });

    expect(
      resolveSignupFlow({
        hasRequiredFields: true,
        passwordsMatch: true,
        authError: false,
        hasSession: false,
        hasUser: false,
      }),
    ).toEqual({ type: "error", code: "signup_failed" });
  });
});

describe("resolveLoginFlow", () => {
  it("redirects to dashboard when next is missing", () => {
    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: false,
      }),
    ).toEqual({ type: "redirect", path: "/dashboard" });
  });

  it("redirects to a safe internal next destination", () => {
    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: false,
        next: "/dashboard/orders",
      }),
    ).toEqual({ type: "redirect", path: "/dashboard/orders" });
  });

  it("falls back when next is external or malformed", () => {
    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: false,
        next: "https://evil.example.com",
      }),
    ).toEqual({ type: "redirect", path: "/dashboard" });

    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: false,
        next: "//evil.example.com",
      }),
    ).toEqual({ type: "redirect", path: "/dashboard" });
  });

  it("returns login errors for invalid credentials", () => {
    expect(
      resolveLoginFlow({
        hasRequiredFields: false,
        authError: false,
      }),
    ).toEqual({ type: "error", code: "missing_fields" });

    expect(
      resolveLoginFlow({
        hasRequiredFields: true,
        authError: true,
      }),
    ).toEqual({ type: "error", code: "invalid_credentials" });
  });
});

describe("Auth route protection", () => {
  it("keeps dashboard, onboarding, orders, and connections protected", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/dashboard/orders")).toBe(true);
    expect(isProtectedAppPath("/dashboard/connections")).toBe(true);
    expect(isProtectedAppPath("/onboarding/store")).toBe(true);
    expect(isProtectedAppPath("/en/dashboard/orders")).toBe(true);
    expect(isProtectedAppPath("/login")).toBe(false);
  });

  it("keeps integration APIs protected for unauthenticated access", () => {
    expect(isProtectedShopifyApiPath("/api/integrations/shopify/status")).toBe(
      true,
    );
    expect(isProtectedMetaApiPath("/api/integrations/meta/status")).toBe(true);
  });
});

describe("buildAuthCallbackUrl", () => {
  it("builds a locale-independent callback with a safe next path", () => {
    expect(buildAuthCallbackUrl("https://app.example.com")).toBe(
      "https://app.example.com/api/auth/callback?next=%2Fonboarding",
    );
    expect(buildAuthCallbackUrl("https://app.example.com", "/dashboard")).toBe(
      "https://app.example.com/api/auth/callback?next=%2Fdashboard",
    );
  });
});
