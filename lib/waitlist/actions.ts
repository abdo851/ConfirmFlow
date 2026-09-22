"use server";

import { createDatabaseClient } from "@/lib/database/client";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { validateWaitlistEntry } from "./validate";

export interface WaitlistState {
  status: "idle" | "saved" | "invalid" | "failed";
}

export async function joinWaitlistAction(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { status: "failed" };
  }

  const provider = String(formData.get("provider") ?? "");
  const email = String(formData.get("email") ?? "");
  const parsed = validateWaitlistEntry({ provider, email });
  if (!parsed.ok) {
    return { status: "invalid" };
  }

  try {
    const db = createDatabaseClient();
    const { error } = await db.from("waitlist").upsert(
      {
        provider: parsed.entry.provider,
        email: parsed.entry.email,
      },
      { onConflict: "provider,email" },
    );
    if (error) {
      return { status: "failed" };
    }
  } catch {
    return { status: "failed" };
  }

  return { status: "saved" };
}
