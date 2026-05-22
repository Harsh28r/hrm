import { describe, expect, it } from "vitest";
import {
  approvedLeaveSpansFromRequests,
  indexApprovedLeaveDaysForMonth,
} from "@/entities/attendance/lib/merge-approved-leave-days";
import { IST_OFFSET_MS } from "@/entities/attendance/lib/time-parse";

function atIst(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day, 12, 0) - IST_OFFSET_MS).toISOString();
}

describe("merge-approved-leave-days", () => {
  it("indexes each IST day in a multi-day approved leave", () => {
    const map = indexApprovedLeaveDaysForMonth(
      [
        {
          userId: "u1",
          startDate: atIst(2026, 4, 8, 0),
          endDate: atIst(2026, 4, 10, 0),
          type: "sick",
        },
      ],
      2026,
      4,
    );
    expect(map.has("u1|8")).toBe(true);
    expect(map.has("u1|9")).toBe(true);
    expect(map.has("u1|10")).toBe(true);
    expect(map.get("u1|9")?.title).toMatch(/Sick leave/i);
  });

  it("maps only approved requests to spans", () => {
    const spans = approvedLeaveSpansFromRequests([
      {
        status: "approved",
        user: { _id: "u2" },
        startDate: atIst(2026, 4, 1, 0),
        endDate: atIst(2026, 4, 2, 0),
      },
      {
        status: "pending_hr",
        user: { _id: "u3" },
        startDate: atIst(2026, 4, 1, 0),
        endDate: atIst(2026, 4, 2, 0),
      },
    ]);
    expect(spans).toHaveLength(1);
    expect(spans[0]?.userId).toBe("u2");
  });
});
