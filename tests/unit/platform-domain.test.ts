import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  INITIAL_PLATFORM_DOMAIN_STATUS,
  canManagePlatformDomain,
  domainStatusCopyKey,
  normalizePlatformDomain,
  planPlatformDomainSave,
  type PlatformDomainRecord,
} from "@/lib/domain/platform-domain";

const existing: PlatformDomainRecord = {
  id: "11111111-1111-1111-1111-111111111111",
  domain: "example.com",
  status: "error",
};

describe("platform domain validation", () => {
  it("normalizes a normal domain", () => {
    expect(normalizePlatformDomain("EXAMPLE.COM")).toBe("example.com");
    expect(normalizePlatformDomain("shop.example.co.uk")).toBe("shop.example.co.uk");
  });

  it("rejects protocols, paths, queries, and whitespace", () => {
    expect(normalizePlatformDomain("https://example.com")).toBeNull();
    expect(normalizePlatformDomain("http://example.com")).toBeNull();
    expect(normalizePlatformDomain("example.com/path")).toBeNull();
    expect(normalizePlatformDomain("example.com?x=1")).toBeNull();
    expect(normalizePlatformDomain("example.com#top")).toBeNull();
    expect(normalizePlatformDomain(" example.com")).toBeNull();
    expect(normalizePlatformDomain("exa mple.com")).toBeNull();
  });

  it("rejects localhost, internal hosts, and IP addresses", () => {
    expect(normalizePlatformDomain("localhost")).toBeNull();
    expect(normalizePlatformDomain("app.localhost")).toBeNull();
    expect(normalizePlatformDomain("printer.local")).toBeNull();
    expect(normalizePlatformDomain("server.internal")).toBeNull();
    expect(normalizePlatformDomain("127.0.0.1")).toBeNull();
    expect(normalizePlatformDomain("192.168.1.10")).toBeNull();
    expect(normalizePlatformDomain("10.0.0.5")).toBeNull();
  });
});

describe("platform domain save plan", () => {
  it("starts a new domain at setup_required", () => {
    expect(planPlatformDomainSave(null, "Example.com")).toEqual({
      ok: true,
      action: "insert",
      domain: "example.com",
      status: INITIAL_PLATFORM_DOMAIN_STATUS,
    });
    expect(INITIAL_PLATFORM_DOMAIN_STATUS).toBe("setup_required");
  });

  it("updates the single existing row and resets status when the domain changes", () => {
    expect(planPlatformDomainSave(existing, "OTHER.example")).toEqual({
      ok: true,
      action: "update",
      id: existing.id,
      domain: "other.example",
      status: "setup_required",
    });
  });

  it("keeps the current status when the domain is unchanged", () => {
    expect(planPlatformDomainSave(existing, "example.com")).toEqual({
      ok: true,
      action: "keep",
      id: existing.id,
      domain: "example.com",
      status: "error",
    });
  });

  it("does not insert a second domain when one already exists", () => {
    const plan = planPlatformDomainSave(existing, "second.example");
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.action).not.toBe("insert");
    }
  });

  it("rejects an invalid domain", () => {
    expect(planPlatformDomainSave(null, "https://example.com")).toEqual({
      ok: false,
      error: "invalid_domain",
    });
  });
});

describe("platform domain access and display", () => {
  it("allows only the existing admin and owner roles", () => {
    expect(canManagePlatformDomain("admin")).toBe(true);
    expect(canManagePlatformDomain("owner")).toBe(true);
    expect(canManagePlatformDomain("user")).toBe(false);
    expect(canManagePlatformDomain(null)).toBe(false);
  });

  it("never labels a stored status as connected", () => {
    expect(domainStatusCopyKey("setup_required")).toBe("customDomainSetupRequired");
    expect(domainStatusCopyKey("pending_verification")).toBe("customDomainSetupRequired");
    expect(domainStatusCopyKey("connected")).toBe("customDomainSetupRequired");
    expect(domainStatusCopyKey("error")).toBe("customDomainSetupRequired");
  });
});

describe("platform domain migration", () => {
  it("creates one admin-only table and a single-row guard", () => {
    const root = path.resolve(__dirname, "../..");
    const sql = readFileSync(
      path.join(root, "supabase/migrations/20261002173000_platform_domain_settings.sql"),
      "utf8",
    );
    const actions = readFileSync(path.join(root, "lib/domain/actions.ts"), "utf8");
    expect(sql).toContain("CREATE TABLE public.platform_domain_settings");
    expect(sql).toContain("platform_domain_settings_singleton");
    expect(sql).toContain("profiles.role IN ('admin', 'owner')");
    expect(sql).toContain("REVOKE ALL ON TABLE public.platform_domain_settings FROM anon");
    expect(sql).not.toContain("GRANT SELECT ON TABLE public.platform_domain_settings TO anon");
    expect(sql).not.toContain("shop_domain");
    expect(sql.match(/CREATE TABLE/g)).toHaveLength(1);
    expect(actions).toContain("platform_domain_settings");
    expect(actions).toContain(".insert(");
    expect(actions).toContain("status: plan.status");
    expect(actions).toContain(".update({ domain: plan.domain, status: plan.status })");
    expect(actions).toContain(".delete()");
    expect(actions).toContain('error: "forbidden"');
  });
});
