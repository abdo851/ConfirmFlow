export const STORES_PER_PROVIDER_LIMIT = 3;

export function storeSlotAvailable(
  existingExternalIds: string[],
  nextExternalId: string,
  limit = STORES_PER_PROVIDER_LIMIT,
): boolean {
  if (existingExternalIds.includes(nextExternalId)) {
    return true;
  }
  return existingExternalIds.length < limit;
}
