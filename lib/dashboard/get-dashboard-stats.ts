import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";
import {
  computeDashboardStats,
  type DashboardDateRange,
  type DashboardOrderStatRow,
  type DashboardStats,
} from "./stats";

export async function getDashboardStats(input: {
  owner_id: string;
  date_range: DashboardDateRange;
}): Promise<DashboardStats> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("orders")
    .select("confirmation_status, received_at, confirmed_at, total_amount_minor")
    .eq("owner_id", input.owner_id);

  if (error) {
    throw new Error("Unable to load dashboard stats.");
  }

  return computeDashboardStats((data ?? []) as DashboardOrderStatRow[], input.date_range);
}
