import { describe, expect, it } from "vitest";
import {
  groupIsActive,
  itemIsActive,
  sidebarGroups,
  visibleSidebarGroups,
} from "@/components/dashboard/sidebar-model";

describe("sidebar navigation", () => {
  it("lists the dashboard groups in order", () => {
    expect(sidebarGroups.map((group) => group.key)).toEqual([
      "overview",
      "orders",
      "analytics",
      "adEvents",
      "connections",
      "shipping",
      "customCarrier",
      "workflow",
      "tracking",
      "marketing",
      "wallet",
      "team",
      "admin",
      "settings",
    ]);
  });

  it("lists shipping companies inside the admin group", () => {
    const admin = sidebarGroups.find((group) => group.key === "admin");
    expect(admin?.items.some((item) => item.href === "/dashboard/admin/shipping" && item.labelKey === "shipping")).toBe(
      true,
    );
  });

  it("hides admin from a regular user and shows it for an admin", () => {
    expect(visibleSidebarGroups(false).some((group) => group.key === "admin")).toBe(false);
    expect(visibleSidebarGroups(true).some((group) => group.key === "admin")).toBe(true);
    expect(visibleSidebarGroups(false).some((group) => group.key === "customCarrier")).toBe(true);
    expect(visibleSidebarGroups(false)).toHaveLength(13);
    expect(visibleSidebarGroups(true)).toHaveLength(14);
  });

  it("highlights a parent from a child path without treating overview as a prefix", () => {
    const orders = sidebarGroups.find((group) => group.key === "orders");
    const overview = sidebarGroups.find((group) => group.key === "overview");
    expect(orders && groupIsActive(orders, "/dashboard/orders")).toBe(true);
    expect(overview && groupIsActive(overview, "/dashboard/orders")).toBe(false);
    expect(overview && groupIsActive(overview, "/dashboard")).toBe(true);
    const shipping = sidebarGroups.find((group) => group.key === "shipping");
    const customCarrier = sidebarGroups.find((group) => group.key === "customCarrier");
    expect(shipping && groupIsActive(shipping, "/dashboard/shipping/sendit")).toBe(true);
    expect(shipping && groupIsActive(shipping, "/dashboard/shipping/custom")).toBe(false);
    expect(customCarrier && groupIsActive(customCarrier, "/dashboard/shipping/custom")).toBe(true);
    expect(sidebarGroups.findIndex((group) => group.key === "customCarrier")).toBe(
      sidebarGroups.findIndex((group) => group.key === "shipping") + 1,
    );
    expect(sidebarGroups.findIndex((group) => group.key === "workflow")).toBe(
      sidebarGroups.findIndex((group) => group.key === "customCarrier") + 1,
    );
  });

  it("matches an order status child and leaves the all-orders link inactive", () => {
    expect(itemIsActive("/dashboard/orders?status=pending", "/dashboard/orders", "status=pending")).toBe(true);
    expect(itemIsActive("/dashboard/orders", "/dashboard/orders", "status=pending")).toBe(false);
    expect(itemIsActive("/dashboard/orders", "/dashboard/orders", "")).toBe(true);
  });
});
