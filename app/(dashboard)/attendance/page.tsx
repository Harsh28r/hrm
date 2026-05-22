import { Suspense } from "react";
import { EmployeeAttendanceView } from "@/widgets/employee-attendance";

export default function AttendancePage() {
  return (
    <Suspense fallback={null}>
      <EmployeeAttendanceView />
    </Suspense>
  );
}
