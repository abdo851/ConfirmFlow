import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import {
  buildDashboardTimeseries,
  type DashboardTimeseriesPoint,
  type DashboardTimeseriesRow,
} from "./stats";

export async function getDashboardTimeseries(input: {
  owner_id: string;
  days: number;
}): Promise<DashboardTimeseriesPoint[]> {
  const db = await createUserDatabaseClient();
  const sessionUser = await getAuthenticatedUser();
  const ownerId = sessionUser?.id ?? input.owner_id;
  const { data, error } = await db
    .from("orders")
    .select("received_at, confirmed_at")
    .eq("owner_id", ownerId);

  if (error) {
    throw new Error("Unable to load dashboard timeseries.");
  }

  return buildDashboardTimeseries((data ?? []) as DashboardTimeseriesRow[], input.days);
}
