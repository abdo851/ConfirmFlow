"use server";

import { revalidatePath } from "next/cache";
import { parsePolicyCatalog, savePolicyCatalog } from "./settings";

export interface SavePoliciesState {
  saved: boolean;
  error: "invalid" | null;
}

export async function savePoliciesAction(
  _previous: SavePoliciesState,
  formData: FormData,
): Promise<SavePoliciesState> {
  const raw = String(formData.get("policies") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { saved: false, error: "invalid" };
  }

  if (!parsePolicyCatalog(parsed)) {
    return { saved: false, error: "invalid" };
  }

  try {
    await savePolicyCatalog(parsed);
  } catch {
    return { saved: false, error: "invalid" };
  }

  for (const locale of ["en", "ar"]) {
    for (const page of ["privacy", "terms", "refund", "cookies"]) {
      revalidatePath(`/${locale}/policies/${page}`);
    }
  }

  return { saved: true, error: null };
}
