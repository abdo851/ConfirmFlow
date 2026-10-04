import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  CUSTOM_DOMAIN_STATE,
  readApplicationDomainStatus,
} from "@/lib/config/domain-status";

describe("application domain status", () => {
  it("reads the configured origin and keeps a custom domain disconnected", () => {
    expect(readApplicationDomainStatus("https://app.example.com/")).toEqual({
      applicationUrl: "https://app.example.com",
      applicationHost: "app.example.com",
      customDomain: null,
      customDomainState: CUSTOM_DOMAIN_STATE,
      setupRequired: true,
    });
    expect(CUSTOM_DOMAIN_STATE).toBe("not_connected");
  });

  it("does not treat a local origin as a connected custom domain", () => {
    const status = readApplicationDomainStatus("http://localhost:3000");
    expect(status.applicationHost).toBe("localhost:3000");
    expect(status.customDomain).toBeNull();
    expect(status.customDomainState).not.toBe("connected");
    expect(status.setupRequired).toBe(true);
  });
});

describe("admin domain page", () => {
  it("links Domain from General settings and does not offer a connection action", () => {
    const root = path.resolve(__dirname, "../..");
    const settings = readFileSync(
      path.join(root, "app/[locale]/dashboard/admin/settings/page.tsx"),
      "utf8",
    );
    const domain = readFileSync(
      path.join(root, "app/[locale]/dashboard/admin/settings/domain/page.tsx"),
      "utf8",
    );

    expect(settings).toContain('href: "/dashboard/admin/settings/domain"');
    expect(domain).toContain("readApplicationDomainStatus");
    expect(domain).toContain("DomainManager");
    expect(domain).not.toContain("Connect domain");
    expect(domain).not.toContain("Connected");
    expect(domain).not.toContain("Verified");
  });
});
