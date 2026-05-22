import type { ApiError } from "@/lib/api/errors";

/** Typed success/failure without throwing (optional pattern for forms). */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
