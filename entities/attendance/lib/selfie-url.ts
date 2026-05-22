import { getApiBaseUrl } from "@/lib/config/env";

/**
 * Builds absolute URL for `GET /api/attendance/selfie/:key` (deltadb public image route).
 * `storageKey` is typically an S3-style key e.g. `attendance/selfies/{userId}/...jpg`.
 */
export function buildAttendanceSelfieImageUrl(storageKey: string | null | undefined): string | null {
  if (storageKey == null) return null;
  const k = String(storageKey).trim();
  if (!k) return null;
  if (k.startsWith("http://") || k.startsWith("https://") || k.startsWith("data:")) {
    return k;
  }
  const base = getApiBaseUrl();
  if (!base) return null;
  const path = k.startsWith("/") ? k.slice(1) : k;
  return `${base}/api/attendance/selfie/${encodeURIComponent(path)}`;
}
