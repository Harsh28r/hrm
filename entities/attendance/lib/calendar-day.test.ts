import { describe, expect, it } from "vitest";
import { calendarPartsInTz, dayOfMonthInTz } from "@/entities/attendance/lib/time-parse";
import {
  cellStatusFromPunch,
  indexPunchesByUserDay,
  punchUserId,
  recordGridDayParts,
} from "@/entities/attendance/lib/map-punch-to-cell";
import { DEFAULT_ATTENDANCE_RULES } from "@/entities/attendance/model/rules";
import { IST_OFFSET_MS } from "@/entities/attendance/lib/time-parse";

function atIst(hour: number, minute: number): string {
  return new Date(Date.UTC(2026, 4, 19, hour, minute) - IST_OFFSET_MS).toISOString();
}
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";

describe("IST calendar day keys", () => {
  it("maps summary IST midnight to correct day-of-month", () => {
    const summaryDate = "2026-05-18T18:30:00.000Z";
    expect(dayOfMonthInTz(summaryDate)).toBe(19);
    const parts = calendarPartsInTz(summaryDate);
    expect(parts).toEqual({ year: 2026, month: 4, day: 19 });
  });

  it("indexes punch on same IST day as summary", () => {
    const record = {
      id: "1",
      date: "2026-05-19T04:54:00.000Z",
      status: "checked-out",
      user: { _id: "u1", name: "Test" },
      checkIn: { time: "2026-05-19T04:54:00.000Z" },
      checkOut: { time: "2026-05-19T14:02:00.000Z" },
    } as AttendanceAdminRecord;
    const map = indexPunchesByUserDay([record], { year: 2026, month: 4 });
    expect(map.has("u1|19")).toBe(true);
  });

  it("resolves user id from populated user.id", () => {
    const record = {
      id: "1",
      date: "2026-05-19T18:30:00.000Z",
      status: "checked-in",
      user: { id: "u-dhawal", name: "Dhawal" },
      checkIn: { time: "2026-05-20T03:30:00.000Z" },
    } as AttendanceAdminRecord;
    expect(punchUserId(record)).toBe("u-dhawal");
    const parts = recordGridDayParts(record, "Asia/Kolkata", { year: 2026, month: 4 });
    expect(parts?.day).toBe(20);
  });

  it("uses check-in time for grid column when work date is previous IST day", () => {
    const record = {
      id: "2",
      date: "2026-05-19T18:30:00.000Z",
      status: "checked-in",
      user: { _id: "u1", name: "Dhawal" },
      checkIn: { time: "2026-05-20T04:00:00.000Z" },
    } as AttendanceAdminRecord;
    const map = indexPunchesByUserDay([record], { year: 2026, month: 4 });
    expect(map.has("u1|20")).toBe(true);
    expect(map.has("u1|19")).toBe(false);
  });

  it("shows checked_in while session is open", () => {
    const open = {
      userId: "u1",
      dayOfMonth: 19,
      checkInTime: atIst(9, 15),
      checkOutTime: null,
      totalHours: null,
      totalBreakMinutes: null,
      isManualEntry: false,
      recordStatus: "checked-in" as const,
    };
    expect(cellStatusFromPunch(open, DEFAULT_ATTENDANCE_RULES)).toBe("checked_in");
    const closed = {
      ...open,
      recordStatus: "checked-out" as const,
      checkOutTime: atIst(18, 30),
      totalHours: 9.25,
    };
    expect(cellStatusFromPunch(closed, DEFAULT_ATTENDANCE_RULES)).toBe("present");
  });
});
