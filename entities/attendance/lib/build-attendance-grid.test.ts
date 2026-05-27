import { describe, expect, it } from "vitest";
import { buildAttendanceGrid } from "@/entities/attendance/lib/build-attendance-grid";
import { IST_OFFSET_MS } from "@/entities/attendance/lib/time-parse";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import type { DaySummaryRow } from "@/entities/attendance/api/summary-queries";

function atIst(year: number, month: number, day: number, hour: number, minute: number): string {
  return new Date(Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MS).toISOString();
}

const shiftRules: AttendanceRules = {
  expectedCheckIn: "10:30",
  expectedCheckOut: "19:30",
  lateAfter: "11:00",
  firstHalfStart: "10:30",
  firstHalfEnd: "13:00",
  secondHalfStart: "14:00",
  secondHalfEnd: "19:30",
  halfDayMaxHours: 4,
  minimumWorkingHours: 9,
  weekOffDays: [0],
  timezone: "Asia/Kolkata",
};

describe("buildAttendanceGrid work status", () => {
  it("present when check-in/out meet shift bounds and hours", () => {
    const punch: AttendanceAdminRecord = {
      id: "a1",
      user: { _id: "u1", name: "Test User" },
      date: atIst(2026, 4, 19, 0, 0),
      status: "checked-out",
      checkIn: { time: atIst(2026, 4, 19, 10, 30) },
      checkOut: { time: atIst(2026, 4, 19, 19, 49) },
      totalHours: 9.5,
    };

    const summaries: DaySummaryRow[] = [
      {
        _id: "s1",
        user: { _id: "u1", name: "Test User" },
        date: atIst(2026, 4, 18, 18, 30),
        dayType: "half_day",
      },
    ];

    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u1", name: "Test User" }],
      summaries,
      punches: [punch],
      rules: shiftRules,
    });

    expect(grid.rows[0]?.cells[19]).toBe("present");
  });

  it("half_day when 9h worked but checkout before expectedCheckOut", () => {
    const punch: AttendanceAdminRecord = {
      id: "a2",
      user: { _id: "u2", name: "Early out" },
      date: atIst(2026, 4, 19, 0, 0),
      status: "checked-out",
      checkIn: { time: atIst(2026, 4, 19, 9, 0) },
      checkOut: { time: atIst(2026, 4, 19, 18, 0) },
      totalHours: 9,
    };
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u2", name: "Early out" }],
      summaries: [],
      punches: [punch],
      rules: shiftRules,
    });
    expect(grid.rows[0]?.cells[19]).toBe("half_day");
  });

  it("manual entry always uses manual icon; half day only in tooltip", () => {
    const punch: AttendanceAdminRecord = {
      id: "a3b",
      user: { _id: "u3b", name: "Early out" },
      date: atIst(2026, 4, 19, 0, 0),
      status: "checked-out",
      isManualEntry: true,
      checkIn: { time: atIst(2026, 4, 19, 9, 0) },
      checkOut: { time: atIst(2026, 4, 19, 18, 0) },
      totalHours: 9,
    };
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u3b", name: "Early out" }],
      summaries: [],
      punches: [punch],
      rules: shiftRules,
    });
    expect(grid.rows[0]?.cells[19]).toBe("manual_present");
    expect(grid.rows[0]?.cellTitles?.[19]).toMatch(/Manual entry/i);
    expect(grid.rows[0]?.cellTitles?.[19]).toMatch(/Half day/i);
    expect(grid.rows[0]?.cellTitles?.[19]).toMatch(/before shift end 19:30/i);
  });

  it("app punch (not manual) keeps half_day icon when rules say so", () => {
    const punch: AttendanceAdminRecord = {
      id: "a3c",
      user: { _id: "u3c", name: "App" },
      date: atIst(2026, 4, 19, 0, 0),
      status: "checked-out",
      isManualEntry: false,
      checkIn: { time: atIst(2026, 4, 19, 9, 0) },
      checkOut: { time: atIst(2026, 4, 19, 18, 0) },
      totalHours: 9,
    };
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u3c", name: "App" }],
      summaries: [],
      punches: [punch],
      rules: shiftRules,
    });
    expect(grid.rows[0]?.cells[19]).toBe("half_day");
  });

  it("shows manual_present icon when manual entry meets full-day rules", () => {
    const punch: AttendanceAdminRecord = {
      id: "a3",
      user: { _id: "u3", name: "Manual" },
      date: atIst(2026, 4, 19, 0, 0),
      status: "checked-out",
      isManualEntry: true,
      checkIn: { time: atIst(2026, 4, 19, 10, 30) },
      checkOut: { time: atIst(2026, 4, 19, 19, 45) },
      totalHours: 9.25,
    };
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u3", name: "Manual" }],
      summaries: [],
      punches: [punch],
      rules: shiftRules,
    });
    expect(grid.rows[0]?.cells[19]).toBe("manual_present");
    expect(grid.rows[0]?.cellTitles?.[19]).toContain("Manual entry");
  });

  it("shows on_leave on grid when approved leave covers the day (overrides punch)", () => {
    const punch: AttendanceAdminRecord = {
      id: "lv1",
      user: { _id: "u-leave", name: "On Leave User" },
      date: atIst(2026, 4, 10, 0, 0),
      status: "checked-out",
      checkIn: { time: atIst(2026, 4, 10, 10, 30) },
      checkOut: { time: atIst(2026, 4, 10, 19, 30) },
      totalHours: 9,
    };
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees: [{ id: "u-leave", name: "On Leave User" }],
      summaries: [],
      punches: [punch],
      rules: shiftRules,
      approvedLeaves: [
        {
          userId: "u-leave",
          startDate: atIst(2026, 4, 10, 0, 0),
          endDate: atIst(2026, 4, 10, 23, 59),
          type: "paid",
        },
      ],
    });
    expect(grid.rows[0]?.cells[10]).toBe("on_leave");
    expect(grid.rows[0]?.cellTitles?.[10]).toMatch(/On leave/i);
  });
});
