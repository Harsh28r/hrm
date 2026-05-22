import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";
import { AttendanceRulesProvider } from "@/features/attendance";
import { DashboardShell } from "@/widgets/sidebar-nav";

export default function DashboardLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <RequireAuth>
      <AttendanceRulesProvider>
        <DashboardShell>
          {children}
          {modal}
        </DashboardShell>
      </AttendanceRulesProvider>
    </RequireAuth>
  );
}
