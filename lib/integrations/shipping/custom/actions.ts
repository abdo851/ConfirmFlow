"use server";

import { probeHttpsUrl, type ProbeResult } from "./probe";
import { isHttpsUrl } from "./schema";
import { deleteCustomCarrier, listCustomCarriers, saveCustomCarrier, setCustomCarrierStatus } from "./store";

export async function listCustomCarriersAction() {
  try {
    return { ok: true as const, carriers: await listCustomCarriers() };
  } catch {
    return { ok: false as const, error: "unavailable" as const, carriers: [] };
  }
}

export async function saveCustomCarrierAction(input: unknown, id?: string) {
  try {
    return await saveCustomCarrier(input, id);
  } catch {
    return { ok: false as const, error: "save_failed" };
  }
}

export async function setCustomCarrierStatusAction(id: string, status: "active" | "inactive") {
  try {
    return await setCustomCarrierStatus(id, status);
  } catch {
    return { ok: false as const, error: "save_failed" };
  }
}

export async function deleteCustomCarrierAction(id: string) {
  try {
    return await deleteCustomCarrier(id);
  } catch {
    return { ok: false as const, error: "save_failed" };
  }
}

export async function testCustomCarrierAction(url: string): Promise<ProbeResult & { error?: string }> {
  if (!isHttpsUrl(url)) {
    return { ok: false, status: null, error: "https_required" };
  }
  const result = await probeHttpsUrl(url);
  return result;
}
