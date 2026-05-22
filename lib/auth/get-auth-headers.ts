import { getStoredAccessToken } from "@/lib/auth/session-storage";

/**
 * Attach Bearer token for upstream HR API calls (`apiFetch`).
 * Token is written by AuthProvider after BFF login.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = getStoredAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
