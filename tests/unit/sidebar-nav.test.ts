import { describe, expect, it } from "vitest";
import {
  groupIsActive,
  itemIsActive,
  sidebarGroups,
  visibleSidebarGroups,
} from "@/components/dashboard/sidebar-model";

describe("sidebar navigation", () => {
  it("lists the ten dashboard groups in order", () => {
    expect(sidebarGroups.map((group) => group.key)).toEqual([
      "overview",
      "orders",
      "analytics",
      "connections",
      "tracking",
      "marketing",
      "wallet",
      "team",
      "admin",
      "settings",
    ]);
  });

  it("hides admin from a regular user and shows it for an admin", () => {
    expect(visibleSidebarGroups(false).some((group) => group.key === "admin")).toBe(false);
    expect(visibleSidebarGroups(true).some((group) => group.key === "admin")).toBe(true);
    expect(visibleSidebarGroups(false)).toHaveLength(9);
    expect(visibleSidebarGroups(true)).toHaveLength(10);
  });

  it("highlights a parent from a child path without treating overview as a prefix", () => {
    const orders = sidebarGroups.find((group) => group.key === "orders");
    const overview = sidebarGroups.find((group) => group.key === "overview");
    expect(orders && groupIsActive(orders, "/dashboard/orders")).toBe(true);
    expect(overview && groupIsActive(overview, "/dashboard/orders")).toBe(false);
    expect(overview && groupIsActive(overview, "/dashboard")).toBe(true);
  });

  it("matches an order status child and leaves the all-orders link inactive", () => {
    expect(itemIsActive("/dashboard/orders?status=pending", "/dashboard/orders", "status=pending")).toBe(true);
    expect(itemIsActive("/dashboard/orders", "/dashboard/orders", "status=pending")).toBe(false);
    expect(itemIsActive("/dashboard/orders", "/dashboard/orders", "")).toBe(true);
  });
});
