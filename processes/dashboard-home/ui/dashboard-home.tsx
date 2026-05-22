import { isApiConfigured } from "@/shared/config";
import { HrmDashboardView } from "@/widgets/hrm-dashboard";

export function DashboardHome() {
  return <HrmDashboardView apiConfigured={isApiConfigured()} />;
}
