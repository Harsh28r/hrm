import type { AppUser } from "@/lib/auth/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Maps upstream `user` / `me` payloads to `AppUser`. */
export function normalizeAppUser(raw: unknown): AppUser | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o.id ?? o._id ?? "").trim();
  const email = String(o.email ?? "").trim().toLowerCase();
  if (!id || !email) return null;

  const name = typeof o.name === "string" ? o.name : typeof o.displayName === "string" ? o.displayName : undefined;
  const perms = asRecord(o.permissions);
  let permissions: string[] = [];
  if (perms && Array.isArray(perms.allowed)) {
    permissions = perms.allowed.filter((x): x is string => typeof x === "string");
  }

  return {
    id,
    email,
    displayName: name,
    name: typeof o.name === "string" ? o.name : undefined,
    role: typeof o.role === "string" ? o.role : undefined,
    permissions,
    raw: o,
  };
}
