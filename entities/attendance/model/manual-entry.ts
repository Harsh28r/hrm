/** Body for `POST /api/attendance/admin/manual-entry` (deltadb). */
export type ManualEntryRequest = {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  reason: string;
};

export type ManualEntryFormState = {
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  reason: string;
};

/** Employee row for the manual-entry user picker (CRM-aligned). */
export type ManualEntryUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

/** Raw row from `GET /api/permissions/all-users`. */
export type ManualEntryPermissionsUserRow = {
  id?: string;
  _id?: string;
  name?: unknown;
  email?: unknown;
  role?: unknown;
  roleid?: unknown;
  isActive?: boolean;
};

export function defaultManualEntryFormState(): ManualEntryFormState {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return {
    userId: "",
    date: `${y}-${m}-${d}`,
    checkInTime: "",
    checkOutTime: "",
    notes: "",
    reason: "",
  };
}

/** Coerce API/user fields to plain text — never throws. */
export function coerceManualEntryText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(coerceManualEntryText).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const o = value as {
      name?: unknown;
      label?: unknown;
      title?: unknown;
      email?: unknown;
      slug?: unknown;
      fullName?: unknown;
      role?: unknown;
      roleid?: unknown;
      toString?: () => string;
    };
    if (typeof o.name === "string") return o.name;
    if (typeof o.fullName === "string") return o.fullName;
    if (typeof o.label === "string") return o.label;
    if (typeof o.title === "string") return o.title;
    if (typeof o.email === "string") return o.email;
    if (typeof o.slug === "string") return o.slug;
    if (typeof o.role === "string") return o.role;
    const nestedRole = coerceManualEntryText(o.roleid);
    if (nestedRole) return nestedRole;
    try {
      const s = o.toString?.();
      if (typeof s === "string" && s && s !== "[object Object]") return s;
    } catch {
      /* ignore */
    }
  }
  return "";
}

/** Case-insensitive search key — never calls `.toLowerCase` on non-strings. */
export function manualEntrySearchKey(query: unknown): string {
  const text = coerceManualEntryText(query).trim();
  try {
    return text.toLowerCase();
  } catch {
    return "";
  }
}

/** Normalize any user-shaped API row into a safe picker row. */
export function normalizeManualEntryUserRecord(user: unknown): ManualEntryUser {
  if (!user || typeof user !== "object") {
    return { id: "", name: "", email: "" };
  }
  const o = user as Record<string, unknown>;
  const id = String(o.id ?? o._id ?? "");
  const email = coerceManualEntryText(o.email).trim();
  const name =
    coerceManualEntryText(o.name).trim() ||
    coerceManualEntryText(o.fullName).trim() ||
    email ||
    (id ? `User ${id.slice(-6)}` : "");
  const role =
    coerceManualEntryText(o.role).trim() ||
    coerceManualEntryText(o.roleid).trim() ||
    undefined;
  return {
    id,
    name,
    email: email || name,
    role: role || undefined,
  };
}

export function normalizeManualEntryUserList(users: unknown[]): ManualEntryUser[] {
  const out: ManualEntryUser[] = [];
  for (const raw of users) {
    try {
      if (!raw || typeof raw !== "object") continue;
      const mapped =
        mapPermissionsUserToManualEntry(raw as ManualEntryPermissionsUserRow) ??
        normalizeManualEntryUserRecord(raw);
      if (!mapped.id) continue;
      out.push({
        id: mapped.id,
        name: coerceManualEntryText(mapped.name).trim() || mapped.email,
        email: coerceManualEntryText(mapped.email).trim() || mapped.name,
        role: mapped.role ? coerceManualEntryText(mapped.role).trim() : undefined,
      });
    } catch {
      /* skip bad row */
    }
  }
  return out;
}

export function matchesManualEntryUserSearch(user: unknown, query: unknown): boolean {
  const q = manualEntrySearchKey(query);
  if (!q) return true;
  const u = normalizeManualEntryUserRecord(user);
  const fields = [u.id, u.name, u.email, u.role];
  return fields.some((f) => {
    const hay = manualEntrySearchKey(f);
    return hay.length > 0 && hay.includes(q);
  });
}

/** Filter picker list by search — safe for any query/user shapes from the API. */
export function filterManualEntryUsersBySearch(
  users: ManualEntryUser[],
  query: unknown,
): ManualEntryUser[] {
  const q = manualEntrySearchKey(query);
  if (!q) return users;
  return users.filter((u) => matchesManualEntryUserSearch(u, query));
}

function resolveManualEntryRoleLabel(u: ManualEntryPermissionsUserRow): string | undefined {
  const role = coerceManualEntryText(u.role).trim();
  if (role && role !== "superadmin") return role;
  const fromRef = coerceManualEntryText(u.roleid).trim();
  return fromRef || undefined;
}

/** Picker / matrix: include inactive users; only drop superadmin. */
export function mapPermissionsUserToPicker(
  u: ManualEntryPermissionsUserRow,
): ManualEntryUser | null {
  const id = String(u.id ?? u._id ?? "");
  if (!id || coerceManualEntryText(u.role).trim() === "superadmin") {
    return null;
  }
  const roleLabel = resolveManualEntryRoleLabel(u);
  const email = coerceManualEntryText(u.email).trim();
  const name = coerceManualEntryText(u.name).trim() || email || `User ${id.slice(-6)}`;
  if (!name && !email) return null;
  return { id, name, email: email || name, role: roleLabel };
}

export function mapPermissionsUserToManualEntry(
  u: ManualEntryPermissionsUserRow,
): ManualEntryUser | null {
  const id = String(u.id ?? u._id ?? "");
  if (!id || u.isActive === false || coerceManualEntryText(u.role).trim() === "superadmin") {
    return null;
  }
  const roleLabel = resolveManualEntryRoleLabel(u);
  const email = coerceManualEntryText(u.email).trim();
  const name = coerceManualEntryText(u.name).trim() || email || `User ${id.slice(-6)}`;
  if (!name && !email) return null;
  return { id, name, email: email || name, role: roleLabel };
}

export function mapEmployeeToManualEntryUser(e: {
  id: string;
  fullName?: unknown;
  email?: unknown;
}): ManualEntryUser {
  const email = coerceManualEntryText(e.email).trim();
  const name = coerceManualEntryText(e.fullName).trim() || email || `User ${e.id.slice(-6)}`;
  return { id: e.id, name, email: email || name };
}
