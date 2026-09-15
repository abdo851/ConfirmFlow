export type AppRole = "owner" | "admin" | "member";

export interface AuthContext {
  userId: string;
  storeId?: string;
  role?: AppRole;
}

export interface AuthorizationPolicy {
  canAccessStore(context: AuthContext, storeId: string): boolean;
  canManageIntegrations(context: AuthContext, storeId: string): boolean;
}

/**
 * Placeholder authorization policy — real RBAC in future milestones.
 */
export const defaultAuthorizationPolicy: AuthorizationPolicy = {
  canAccessStore(context, storeId) {
    return Boolean(context.userId && context.storeId === storeId);
  },
  canManageIntegrations(context, storeId) {
    return (
      this.canAccessStore(context, storeId) &&
      (context.role === "owner" || context.role === "admin")
    );
  },
};
