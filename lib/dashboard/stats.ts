export interface DashboardDateRange {
  from: string;
  to: string;
}

export interface DashboardOrderStatRow {
  confirmation_status: "pending" | "confirmed" | "rejected" | "archived";
  received_at: string;
  confirmed_at: string | null;
  total_amount_minor: number | string;
}

export interface DashboardStats {
  new_orders: number;
  confirmed_orders: number;
  rejected_orders: number;
  archived_orders: number;
  total_orders: number;
  confirmed_revenue_minor: bigint;
  avg_order_value_minor: bigint;
  confirmation_rate: number;
}

export interface DashboardTimeseriesPoint {
  date: string;
  new: number;
  confirmed: number;
}

export interface DashboardTimeseriesRow {
  received_at: string;
  confirmed_at: string | null;
}

function inRange(value: string | null, range: DashboardDateRange): boolean {
  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();
  return time >= new Date(range.from).getTime() && time <= new Date(range.to).getTime();
}

function toMinor(value: number | string): bigint {
  return BigInt(value);
}

export function computeDashboardStats(
  rows: DashboardOrderStatRow[],
  range: DashboardDateRange,
): DashboardStats {
  let newOrders = 0;
  let confirmedOrders = 0;
  let rejectedOrders = 0;
  let archivedOrders = 0;
  let confirmedRevenue = BigInt(0);

  for (const row of rows) {
    if (row.confirmation_status === "pending" && inRange(row.received_at, range)) {
      newOrders += 1;
    }

    if (row.confirmation_status === "confirmed" && inRange(row.confirmed_at, range)) {
      confirmedOrders += 1;
      confirmedRevenue += toMinor(row.total_amount_minor);
    }

    if (row.confirmation_status === "rejected") {
      rejectedOrders += 1;
    }

    if (row.confirmation_status === "archived") {
      archivedOrders += 1;
    }
  }

  const total = rows.length;
  const average =
    confirmedOrders === 0 ? BigInt(0) : confirmedRevenue / BigInt(confirmedOrders);

  return {
    new_orders: newOrders,
    confirmed_orders: confirmedOrders,
    rejected_orders: rejectedOrders,
    archived_orders: archivedOrders,
    total_orders: total,
    confirmed_revenue_minor: confirmedRevenue,
    avg_order_value_minor: average,
    confirmation_rate: total === 0 ? 0 : (confirmedOrders / total) * 100,
  };
}

function utcDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function buildDashboardTimeseries(
  rows: DashboardTimeseriesRow[],
  days: number,
  now: Date = new Date(),
): DashboardTimeseriesPoint[] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const points: DashboardTimeseriesPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - offset);
    points.push({ date: utcDateKey(day), new: 0, confirmed: 0 });
  }

  const index = new Map(points.map((point, position) => [point.date, position]));

  for (const row of rows) {
    const receivedKey = utcDateKey(new Date(row.received_at));
    const receivedIndex = index.get(receivedKey);
    if (receivedIndex !== undefined) {
      points[receivedIndex].new += 1;
    }

    if (row.confirmed_at) {
      const confirmedKey = utcDateKey(new Date(row.confirmed_at));
      const confirmedIndex = index.get(confirmedKey);
      if (confirmedIndex !== undefined) {
        points[confirmedIndex].confirmed += 1;
      }
    }
  }

  return points;
}
