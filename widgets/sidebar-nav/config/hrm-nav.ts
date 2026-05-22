import type { ComponentType } from "react";
import { en } from "@/shared/i18n";
import {
  IconCalendar,
  IconClock,
  IconHome,
  IconPayroll,
  IconUser,
  IconUsers,
} from "@/shared/ui/nav-icons";

export type NavLinkConfig = {
  type: "link";
  id: string;
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  showLeaveBadge?: boolean;
};

export type NavGroupConfig = {
  type: "group";
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  children: Array<{ id: string; href: string; label: string }>;
};

export type NavItemConfig = NavLinkConfig | NavGroupConfig;

export function isNavGroup(item: NavItemConfig): item is NavGroupConfig {
  return item.type === "group";
}

export const hrmNavItems: NavItemConfig[] = [
  { type: "link", id: "home", href: "/", label: en.nav.home, Icon: IconHome },
  { type: "link", id: "employees", href: "/employees", label: en.nav.employees, Icon: IconUsers },
  {
    type: "group",
    id: "attendance",
    label: en.nav.attendance,
    Icon: IconClock,
    children: [
      { id: "attendance-overview", href: "/attendance", label: en.nav.attendanceOverview },
      { id: "attendance-manual-entry", href: "/attendance/manual-entry", label: en.nav.attendanceManualEntry },
      { id: "attendance-rules", href: "/attendance/rules", label: en.nav.attendanceRules },
    ],
  },
  {
    type: "link",
    id: "leave",
    href: "/leave",
    label: en.nav.leave,
    Icon: IconCalendar,
    showLeaveBadge: true,
  },
  {
    type: "group",
    id: "payroll",
    label: en.nav.payroll,
    Icon: IconPayroll,
    children: [
      { id: "payroll-list", href: "/payroll/list", label: en.nav.payrollPayList },
      { id: "payroll-payslip", href: "/payroll/payslip", label: en.nav.payrollPayslip },
    ],
  },
  { type: "link", id: "profile", href: "/profile", label: en.nav.profile, Icon: IconUser },
];
