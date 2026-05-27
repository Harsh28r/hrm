import { describe, expect, it } from "vitest";
import { DEFAULT_ATTENDANCE_RULES } from "@/entities/attendance/model/rules";
import { IST_OFFSET_MS } from "@/entities/attendance/lib/time-parse";
import {
  applyWorkedHoursRules,
  isLateCheckIn,
  statusFromCheckInTime,
  statusFromPunch,
} from "@/entities/attendance/lib/time-rules";

const rules = { ...DEFAULT_ATTENDANCE_RULES, timezone: "Asia/Kolkata" as const };

/** 2026-05-19 at HH:mm IST → ISO */
function atIst(hour: number, minute: number): string {
  return new Date(Date.UTC(2026, 4, 19, hour, minute) - IST_OFFSET_MS).toISOString();
}

describe("statusFromCheckInTime (IST)", () => {
  it("early check-in before first half counts as present", () => {
    expect(statusFromCheckInTime(atIst(7, 30), rules)).toBe("present");
    expect(isLateCheckIn(atIst(7, 30), rules)).toBe(false);
  });

  it("on-time check-in counts as present", () => {
    expect(statusFromCheckInTime(atIst(9, 15), rules)).toBe("present");
  });

  it("check-in after lateAfter within first half counts as late", () => {
    expect(statusFromCheckInTime(atIst(10, 0), rules)).toBe("late");
    expect(isLateCheckIn(atIst(10, 0), rules)).toBe(true);
  });

  it("second-half-only check-in is half day", () => {
    expect(statusFromCheckInTime(atIst(15, 0), rules)).toBe("half_day");
  });

  it("check-in 10:24 is present when expected check-in is 10:30 (early)", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      lateAfter: "09:30",
      firstHalfStart: "10:30",
    };
    expect(statusFromCheckInTime(atIst(10, 24), shift)).toBe("present");
  });

  it("first half wins when second-half window overlaps (10:24 present)", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      lateAfter: "11:00",
      firstHalfStart: "10:00",
      firstHalfEnd: "13:00",
      secondHalfStart: "10:00",
      secondHalfEnd: "18:00",
    };
    expect(statusFromCheckInTime(atIst(10, 24), shift)).toBe("present");
  });

  it("check-out time is ignored — status comes from check-in only", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      lateAfter: "11:00",
      firstHalfStart: "10:30",
      expectedCheckOut: "19:30",
    };
    expect(statusFromCheckInTime(atIst(10, 24), shift)).toBe("present");
  });

  it("early check-in stays present when firstHalfEnd is before check-in (misaligned rules)", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      lateAfter: "11:00",
      firstHalfStart: "10:30",
      firstHalfEnd: "07:30",
      secondHalfStart: "14:00",
      secondHalfEnd: "19:30",
      expectedCheckOut: "19:30",
    };
    expect(statusFromCheckInTime(atIst(10, 20), shift)).toBe("present");
  });

  it("early check-in is ok; early check-out before shift end is half_day", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      lateAfter: "11:00",
      firstHalfStart: "10:30",
      firstHalfEnd: "13:00",
      expectedCheckOut: "19:30",
      secondHalfStart: "14:00",
      secondHalfEnd: "19:30",
      halfDayMaxHours: 4,
      minimumWorkingHours: 9,
    };
    expect(
      statusFromPunch(atIst(10, 20), shift, {
        checkOutIso: atIst(19, 49),
        totalHours: 9.5,
      }),
    ).toBe("present");
    expect(
      statusFromPunch(atIst(10, 30), shift, {
        checkOutIso: atIst(18, 0),
        totalHours: 9.5,
      }),
    ).toBe("half_day");
    expect(
      statusFromPunch(atIst(10, 30), shift, {
        checkOutIso: atIst(19, 49),
        totalHours: 9.5,
      }),
    ).toBe("present");
    expect(statusFromCheckInTime(atIst(19, 49), shift)).toBe("half_day");
  });

  it("applyWorkedHoursRules: under full day → half_day, at/above full day → present", () => {
    const shift = { ...rules, halfDayMaxHours: 4, minimumWorkingHours: 9 };
    expect(applyWorkedHoursRules("present", 5, shift)).toBe("half_day");
    expect(applyWorkedHoursRules("present", 9, shift)).toBe("present");
    expect(applyWorkedHoursRules("late", 8.5, shift)).toBe("half_day");
    expect(applyWorkedHoursRules("half_day", 2, shift)).toBe("half_day");
    expect(applyWorkedHoursRules("present", null, shift)).toBe("half_day");
  });

  it("statusFromPunch: on-time check-in without checkout is not present when minimum hours set", () => {
    const shift = { ...rules, minimumWorkingHours: 9 };
    expect(statusFromPunch(atIst(9, 15), shift)).toBe("half_day");
    expect(
      statusFromPunch(atIst(9, 15), shift, {
        checkOutIso: atIst(18, 30),
        totalHours: 9.25,
      }),
    ).toBe("present");
    expect(
      statusFromPunch(atIst(9, 15), shift, {
        checkOutIso: atIst(17, 0),
        totalHours: 7.5,
      }),
    ).toBe("half_day");
  });

  it("statusFromPunch: subtracts break minutes from worked hours", () => {
    const shift = { ...rules, minimumWorkingHours: 9 };
    expect(
      statusFromPunch(atIst(9, 0), shift, {
        checkOutIso: atIst(19, 0),
        totalHours: 10,
        breakMinutes: 90,
      }),
    ).toBe("half_day");
  });

  it("early check-out uses expectedCheckOut from saved rules", () => {
    const shift17 = {
      ...rules,
      expectedCheckIn: "10:30",
      expectedCheckOut: "17:00",
      minimumWorkingHours: 8,
    };
    expect(
      statusFromPunch(atIst(10, 30), shift17, {
        checkOutIso: atIst(18, 0),
        totalHours: 8,
      }),
    ).toBe("present");
    const shift19 = { ...shift17, expectedCheckOut: "19:30" };
    expect(
      statusFromPunch(atIst(10, 30), shift19, {
        checkOutIso: atIst(18, 0),
        totalHours: 8,
      }),
    ).toBe("half_day");
  });

  it("early in (9:00) allowed; early out (18:00) before 19:30 is half_day", () => {
    const shift = {
      ...rules,
      expectedCheckIn: "10:30",
      expectedCheckOut: "19:30",
      lateAfter: "11:00",
      firstHalfStart: "10:30",
      firstHalfEnd: "13:00",
      secondHalfStart: "14:00",
      secondHalfEnd: "19:30",
      minimumWorkingHours: 9,
    };
    expect(
      statusFromPunch(atIst(9, 0), shift, {
        checkOutIso: atIst(18, 0),
        totalHours: 9,
      }),
    ).toBe("half_day");
    expect(
      statusFromPunch(atIst(9, 0), shift, {
        checkOutIso: atIst(19, 30),
        totalHours: 9,
      }),
    ).toBe("present");
    expect(
      statusFromPunch(atIst(10, 30), shift, {
        checkOutIso: atIst(19, 30),
        totalHours: 9,
      }),
    ).toBe("present");
    expect(
      statusFromPunch(atIst(10, 30), shift, {
        checkOutIso: atIst(19, 45),
        totalHours: 9.25,
      }),
    ).toBe("present");
  });
});
