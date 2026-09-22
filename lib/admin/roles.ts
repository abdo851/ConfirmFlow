export type AppRole = "user" | "admin" | "owner";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "owner";
}
