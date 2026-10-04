import type { AdapterInterface, IntegrationKind } from "./types";

const adapters = new Map<string, AdapterInterface<unknown>>();

export function registerAdapter(adapter: AdapterInterface<unknown>): void {
  adapters.set(adapter.providerId, adapter);
}

export function getAdapter(providerId: string): AdapterInterface<unknown> | null {
  return adapters.get(providerId) ?? null;
}

export function listAdapters(): AdapterInterface<unknown>[] {
  return [...adapters.values()];
}

export function listAdaptersByKind(kind: IntegrationKind): AdapterInterface<unknown>[] {
  return [...adapters.values()].filter((adapter) => adapter.kind === kind);
}
