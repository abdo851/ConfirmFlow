/**
 * Returns true when the service role key is configured for admin DB access.
 */
export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
