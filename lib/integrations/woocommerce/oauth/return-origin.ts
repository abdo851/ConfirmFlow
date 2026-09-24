/**
 * Browser origin for the WooCommerce return redirect.
 * The callback URL stays on the public app URL so WooCommerce can reach it.
 * The browser must return to the origin that started connect, otherwise the
 * session cookie belongs to a different host and the status page looks disconnected.
 */
export function resolveWooCommerceBrowserOrigin(input: {
  requestUrl: string;
  forwardedHost: string | null;
  forwardedProto: string | null;
  appBaseUrl: string;
}): string {
  const appOrigin = new URL(input.appBaseUrl).origin;
  const candidates: string[] = [];

  if (input.forwardedHost) {
    const host = input.forwardedHost.split(",")[0]?.trim();
    const proto = (input.forwardedProto ?? "https").split(",")[0]?.trim() || "https";
    if (host) {
      candidates.push(`${proto}://${host}`);
    }
  }

  try {
    candidates.push(new URL(input.requestUrl).origin);
  } catch {
    // Ignore a malformed request URL and fall back to the app origin.
  }

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.origin === appOrigin) {
        return url.origin;
      }
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return url.origin;
      }
    } catch {
      continue;
    }
  }

  return appOrigin;
}
