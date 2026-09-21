const DEFAULT_LOGIN_DESTINATION = "/dashboard";

function isSafeInternalPathname(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return false;
  }

  if (pathname.includes("://") || pathname.includes("\\") || pathname.includes("@")) {
    return false;
  }

  if (pathname.split("/").some((segment) => segment === "..")) {
    return false;
  }

  return true;
}

function isSafeInternalSearch(search: string): boolean {
  if (!search) {
    return true;
  }

  if (!search.startsWith("?")) {
    return false;
  }

  if (search.includes("://") || search.includes("\\") || search.includes("@")) {
    return false;
  }

  return true;
}

export function resolveSafeInternalRedirect(
  next: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_DESTINATION,
): string {
  if (!next || typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();
  const queryIndex = trimmed.indexOf("?");
  const pathname =
    queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : trimmed.slice(queryIndex);

  if (!isSafeInternalPathname(pathname) || !isSafeInternalSearch(search)) {
    return fallback;
  }

  return `${pathname}${search}`;
}
