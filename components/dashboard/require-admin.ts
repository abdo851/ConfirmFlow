import "server-only";

import { redirect } from "@/i18n/navigation";
import { isAdminRole } from "@/lib/admin/roles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";

export async function requireDashboardAdmin(locale: string): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const db = await createUserDatabaseClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(data?.role)) {
    return redirect({ href: "/dashboard", locale });
  }
}
