/**
 * Normalized user from login / `/api/superadmin/me` (or nested `user` in profile payloads).
 */
export type AppUser = {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  role?: string;
  /** Permission strings from `permissions.allowed` when present */
  permissions: string[];
  /** Original payload subset for debugging / forward-compat */
  raw?: Record<string, unknown>;
};
