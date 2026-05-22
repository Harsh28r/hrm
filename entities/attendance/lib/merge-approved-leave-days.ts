import { calendarPartsInTz, IST_OFFSET_MS } from "@/entities/attendance/lib/time-parse";

export type ApprovedLeaveSpan = {
  userId: string;
  startDate: string;
  endDate: string;
  type?: string;
};

function leaveUserId(user: unknown): string | null {
  if (!user) return null;
  if (typeof user === "string") return user;
  const o = user as { _id?: string; id?: string };
  const raw = o._id ?? o.id;
  return raw ? String(raw) : null;
}

function istMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  paid: "Paid leave",
  sick: "Sick leave",
  unpaid: "Unpaid leave",
  campoff: "Camp-off leave",
};

/** Approved leave days in a month (IST calendar), keyed `userId|dayOfMonth`. */
export function indexApprovedLeaveDaysForMonth(
  leaves: ApprovedLeaveSpan[],
  year: number,
  month: number,
  timezone = "Asia/Kolkata",
): Map<string, { title: string }> {
  const out = new Map<string, { title: string }>();
  const dim = new Date(year, month + 1, 0).getDate();

  for (const leave of leaves) {
    const uid = leave.userId;
    if (!uid) continue;

    const startParts = calendarPartsInTz(leave.startDate, timezone);
    const endParts = calendarPartsInTz(leave.endDate, timezone);
    if (!startParts || !endParts) continue;

    let cur = istMidnightUtc(startParts.year, startParts.month, startParts.day);
    const end = istMidnightUtc(endParts.year, endParts.month, endParts.day);

    while (cur.getTime() <= end.getTime()) {
      const parts = calendarPartsInTz(cur.toISOString(), timezone);
      if (parts && parts.year === year && parts.month === month) {
        const dom = parts.day;
        if (dom >= 1 && dom <= dim) {
          const typeNote = leave.type
            ? LEAVE_TYPE_LABEL[leave.type] ?? leave.type
            : "Approved leave";
          out.set(`${uid}|${dom}`, { title: `On leave — ${typeNote}` });
        }
      }
      cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return out;
}

export function approvedLeaveSpansFromRequests(
  requests: Array<{
    status: string;
    user?: unknown;
    startDate: string;
    endDate: string;
    type?: string;
  }>,
): ApprovedLeaveSpan[] {
  const spans: ApprovedLeaveSpan[] = [];
  for (const req of requests) {
    if (req.status !== "approved") continue;
    const userId = leaveUserId(req.user);
    if (!userId) continue;
    spans.push({
      userId,
      startDate: req.startDate,
      endDate: req.endDate,
      type: req.type,
    });
  }
  return spans;
}
