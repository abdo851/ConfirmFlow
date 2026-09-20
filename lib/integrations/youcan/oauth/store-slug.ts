const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeStoreSlug(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || !STORE_SLUG_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}
