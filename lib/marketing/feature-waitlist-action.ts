"use server";

import { parseFeatureWaitlist, saveFeatureWaitlist } from "./feature-waitlist";

export interface FeatureWaitlistState {
  status: "idle" | "saved" | "invalid";
}

export async function joinFeatureWaitlistAction(
  _previous: FeatureWaitlistState,
  formData: FormData,
): Promise<FeatureWaitlistState> {
  const parsed = parseFeatureWaitlist({
    feature: String(formData.get("feature") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.ok) {
    return { status: "invalid" };
  }

  const saved = await saveFeatureWaitlist(parsed.feature, parsed.email);
  return { status: saved ? "saved" : "invalid" };
}
