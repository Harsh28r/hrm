import { describe, expect, it } from "vitest";
import { mergeMatrixEmployees } from "@/entities/attendance/lib/merge-matrix-employees";
import { buildAttendanceGrid } from "@/entities/attendance/lib/build-attendance-grid";
import { DEFAULT_ATTENDANCE_RULES } from "@/entities/attendance/model/rules";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";

describe("matrix search", () => {
  const punch: AttendanceAdminRecord = {
    id: "a1",
    user: { _id: "u1", name: "Dhawal Kumar", email: "d@x.com" },
    date: "2026-05-20T00:00:00.000Z",
    checkIn: { time: "2026-05-20T04:00:00.000Z" },
    checkOut: null,
    status: "checked-in",
  };

  it("mergeMatrixEmployees only adds punch users matching search", () => {
    const merged = mergeMatrixEmployees([], [punch], "dhawal");
    expect(merged).toHaveLength(1);
    expect(merged[0]?.name).toBe("Dhawal Kumar");

    const none = mergeMatrixEmployees([], [punch], "zzz");
    expect(none).toHaveLength(0);
  });

  it("buildAttendanceGrid renders pre-merged employees", () => {
    const employees = mergeMatrixEmployees([], [punch], "dhawal");
    const grid = buildAttendanceGrid({
      year: 2026,
      month: 4,
      employees,
      summaries: [],
      punches: [punch],
      rules: DEFAULT_ATTENDANCE_RULES,
    });
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0]?.employee.name).toContain("Dhawal");
  });
});
