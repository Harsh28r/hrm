import { apiFetch } from "@/shared/api";
import { notifyAttendanceRulesChanged } from "@/entities/attendance/lib/attendance-rules-events";
import {
  normalizeAttendanceRules,
  type AttendanceRules,
} from "@/entities/attendance/model/rules";

type RulesResponse = AttendanceRules & { _id?: string };

let rulesFetchInFlight: Promise<AttendanceRules> | null = null;

export async function fetchAttendanceRules(init?: RequestInit): Promise<AttendanceRules> {
  if (rulesFetchInFlight) {
    return rulesFetchInFlight;
  }

  rulesFetchInFlight = (async () => {
    try {
      const res = await apiFetch<RulesResponse>("/api/hrm/attendance/rules", {
        cache: "no-store",
        ...init,
      });
      return normalizeAttendanceRules(res);
    } finally {
      rulesFetchInFlight = null;
    }
  })();

  return rulesFetchInFlight;
}

export async function updateAttendanceRules(
  patch: Partial<AttendanceRules>,
  init?: RequestInit,
): Promise<AttendanceRules> {
  const res = await apiFetch<RulesResponse>("/api/hrm/attendance/rules", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(patch),
    cache: "no-store",
    ...init,
  });
  const normalized = normalizeAttendanceRules(res);
  notifyAttendanceRulesChanged();
  return normalized;
}
