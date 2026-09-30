import { lookup } from "node:dns/promises";
import { isHttpsUrl } from "./schema";

export type ProbeResult = { ok: boolean; status: number | null };

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host.endsWith(".local");
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((part) => Number(part));
  if (nums.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b] = nums;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const ip = address.toLowerCase().split("%")[0];
  if (ip === "::" || ip === "::1" || ip === "0:0:0:0:0:0:0:0" || ip === "0:0:0:0:0:0:0:1") return true;
  if (ip.startsWith("::ffff:") && ip.includes(".")) return isPrivateIpv4(ip.slice(7));
  const head = ip.split(":")[0];
  const first = Number.parseInt(head, 16);
  if (Number.isNaN(first)) return false;
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  return false;
}

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (value.includes(":")) return isPrivateIpv6(value);
  return isPrivateIpv4(value);
}

async function isBlockedTarget(url: string): Promise<boolean> {
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    return true;
  }
  if (isBlockedHostname(hostname) || isPrivateAddress(hostname)) return true;
  try {
    const records = await lookup(hostname.replace(/^\[|\]$/g, ""), { all: true, verbatim: true });
    return records.some((record) => isPrivateAddress(record.address));
  } catch {
    return true;
  }
}

export async function probeHttpsUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ProbeResult> {
  if (!isHttpsUrl(url) || (await isBlockedTarget(url))) {
    return { ok: false, status: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const head = await fetchImpl(url, { method: "HEAD", signal: controller.signal, redirect: "manual" });
    if (head.status !== 405 && head.status !== 501) {
      return { ok: head.ok, status: head.status };
    }
    const posted = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      signal: controller.signal,
      redirect: "manual",
    });
    return { ok: posted.ok, status: posted.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}
