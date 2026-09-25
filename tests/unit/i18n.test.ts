import { readFileSync, readdirSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "@/i18n/routing";
import { localeCookieName } from "@/i18n/routing";
import {
  getLocaleDirection,
  isAppLocale,
} from "@/lib/i18n/locales";
import { buildShopifyOAuthCallbackUrl } from "@/lib/config/app-url";
import {
  getLocaleFromPathname,
  stripLocalePrefix,
  withLocalePath,
} from "@/lib/i18n/paths";

const messagesRoot = path.resolve(__dirname, "../../messages");
const namespaces = [
  "common",
  "navigation",
  "auth",
  "landing",
  "dashboard",
  "onboarding",
  "connections",
  "errors",
  "orders",
  "admin",
  "policies",
  "tracking",
];

function loadJson(locale: string, namespace: string) {
  const filePath = path.join(messagesRoot, locale, `${namespace}.json`);
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n foundation", () => {
  it("defines supported locales and default locale", () => {
    expect(locales).toEqual(["en", "ar"]);
    expect(defaultLocale).toBe("en");
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("ar")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
  });

  it("maps locale direction for RTL and LTR", () => {
    expect(getLocaleDirection("en")).toBe("ltr");
    expect(getLocaleDirection("ar")).toBe("rtl");
  });

  it("strips and applies locale path prefixes", () => {
    expect(stripLocalePrefix("/en/dashboard")).toBe("/dashboard");
    expect(stripLocalePrefix("/ar/onboarding/store")).toBe("/onboarding/store");
    expect(getLocaleFromPathname("/ar/dashboard")).toBe("ar");
    expect(withLocalePath("ar", "/dashboard")).toBe("/ar/dashboard");
    expect(withLocalePath("en", "/")).toBe("/en");
  });

  it("uses a locale cookie name for persistence", () => {
    expect(localeCookieName).toBe("NEXT_LOCALE");
  });

  it("keeps API routes language-independent", () => {
    expect(stripLocalePrefix("/api/integrations/shopify/connect")).toBe(
      "/api/integrations/shopify/connect",
    );
    expect(getLocaleFromPathname("/api/health")).toBe(defaultLocale);
  });

  it("resolves matching translation keys in English and Arabic", () => {
    for (const namespace of namespaces) {
      const enKeys = flattenKeys(loadJson("en", namespace)).sort();
      const arKeys = flattenKeys(loadJson("ar", namespace)).sort();
      expect(arKeys).toEqual(enKeys);
    }
  });

  it("includes important UI strings in both languages", () => {
    const enLanding = loadJson("en", "landing");
    const arLanding = loadJson("ar", "landing");
    expect(enLanding.heroTitle).toBeTruthy();
    expect(arLanding.heroTitle).toBeTruthy();
    expect(enLanding.heroTitle).not.toBe(arLanding.heroTitle);

    const enAuth = loadJson("en", "auth");
    const arAuth = loadJson("ar", "auth");
    expect(enAuth.loginTitle).toBeTruthy();
    expect(arAuth.loginTitle).toBeTruthy();
  });

  it("does not include secrets in translation resources", () => {
    const secretPatterns = [
      /shpat_/i,
      /service.role/i,
      /SHOPIFY_API_SECRET/i,
      /SUPABASE_SERVICE_ROLE/i,
      /password\s*[:=]/i,
    ];

    for (const locale of locales) {
      const files = readdirSync(path.join(messagesRoot, locale)).filter((file) =>
        file.endsWith(".json"),
      );

      for (const file of files) {
        const contents = readFileSync(
          path.join(messagesRoot, locale, file),
          "utf8",
        );

        for (const pattern of secretPatterns) {
          expect(contents).not.toMatch(pattern);
        }
      }
    }
  });
});

describe("URL configuration", () => {
  it("builds locale-independent Shopify OAuth callback URL", () => {
    const callbackUrl = buildShopifyOAuthCallbackUrl("https://app.example.com");

    expect(callbackUrl).toBe(
      "https://app.example.com/api/integrations/shopify/callback",
    );
    expect(callbackUrl).not.toContain("/en/");
    expect(callbackUrl).not.toContain("/ar/");
  });
});
