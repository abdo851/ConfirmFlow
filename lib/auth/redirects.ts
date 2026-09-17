const DEFAULT_LOGIN_DESTINATION = "/dashboard";

export function resolveSafeInternalRedirect(
  next: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_DESTINATION,
): string {
  if (!next || typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("@")) {
    return fallback;
  }

  if (trimmed.split("/").some((segment) => segment === "..")) {
    return fallback;
  }

  return trimmed;
}
