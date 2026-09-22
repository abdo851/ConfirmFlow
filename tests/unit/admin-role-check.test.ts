import { describe, expect, it } from "vitest";
import { isAdminRole } from "@/lib/admin/roles";

describe("admin role check", () => {
  it("allows admin and owner", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("owner")).toBe(true);
  });

  it("rejects merchants and missing roles", () => {
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
