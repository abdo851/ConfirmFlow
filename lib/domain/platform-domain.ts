import { isAdminRole } from "@/lib/admin/roles";

export const PLATFORM_DOMAIN_STATUSES = [
  "setup_required",
  "pending_verification",
  "connected",
  "error",
] as const;

export type PlatformDomainStatus = (typeof PLATFORM_DOMAIN_STATUSES)[number];

export const INITIAL_PLATFORM_DOMAIN_STATUS = "setup_required" as const;

const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "broadcasthost",
]);

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home",
  ".lan",
  ".localdomain",
];

export type PlatformDomainRecord = {
  id: string;
  domain: string;
  status: PlatformDomainStatus;
};

export type PlatformDomainPlan =
  | { ok: false; error: "invalid_domain" }
  | {
      ok: true;
      action: "insert";
      domain: string;
      status: typeof INITIAL_PLATFORM_DOMAIN_STATUS;
    }
  | {
      ok: true;
      action: "update";
      id: string;
      domain: string;
      status: typeof INITIAL_PLATFORM_DOMAIN_STATUS;
    }
  | {
      ok: true;
      action: "keep";
      id: string;
      domain: string;
      status: PlatformDomainStatus;
    };

export function canManagePlatformDomain(role: string | null | undefined): boolean {
  return isAdminRole(role);
}

export function normalizePlatformDomain(input: string): string | null {
  if (typeof input !== "string" || input.length === 0 || input !== input.trim()) {
    return null;
  }
  if (/\s/.test(input)) {
    return null;
  }

  const domain = input.toLowerCase();
  if (
    domain.includes("://") ||
    domain.includes("/") ||
    domain.includes("?") ||
    domain.includes("#") ||
    domain.includes("\\") ||
    domain.includes(":") ||
    domain.includes("@")
  ) {
    return null;
  }
  if (!DOMAIN_PATTERN.test(domain)) {
    return null;
  }
  if (BLOCKED_HOSTS.has(domain) || BLOCKED_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return null;
  }
  if (isIpAddress(domain)) {
    return null;
  }
  return domain;
}

export function planPlatformDomainSave(
  existing: PlatformDomainRecord | null,
  rawDomain: string,
): PlatformDomainPlan {
  const domain = normalizePlatformDomain(rawDomain);
  if (!domain) {
    return { ok: false, error: "invalid_domain" };
  }

  if (!existing) {
    return {
      ok: true,
      action: "insert",
      domain,
      status: INITIAL_PLATFORM_DOMAIN_STATUS,
    };
  }

  if (existing.domain === domain) {
    return {
      ok: true,
      action: "keep",
      id: existing.id,
      domain,
      status: existing.status,
    };
  }

  return {
    ok: true,
    action: "update",
    id: existing.id,
    domain,
    status: INITIAL_PLATFORM_DOMAIN_STATUS,
  };
}

/** UI copy stays on setup required. This screen cannot claim a live connection. */
export function domainStatusCopyKey(status: string): "customDomainSetupRequired" {
  if (
    status === "setup_required" ||
    status === "pending_verification" ||
    status === "connected" ||
    status === "error"
  ) {
    return "customDomainSetupRequired";
  }
  return "customDomainSetupRequired";
}

function isIpAddress(domain: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) {
    return true;
  }
  return domain.includes(":");
}
