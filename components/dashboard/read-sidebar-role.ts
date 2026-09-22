import "server-only";

import { isAdminRole } from "@/lib/admin/roles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";

export async function readSidebarIsAdmin(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return false;
    }

    const db = await createUserDatabaseClient();
    const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return isAdminRole(data?.role);
  } catch {
    return false;
  }
}
