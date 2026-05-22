/**
 * Navigation/chrome icons — Lucide (24px grid, tunable stroke) for crisp admin-template parity.
 */
import type { ComponentProps } from "react";
import {
  Bell,
  CalendarDays,
  Clock,
  IndianRupee,
  LayoutDashboard,
  Menu,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

const stroke = 1.65;

type LucideIconProps = ComponentProps<typeof LayoutDashboard>;

export function IconHome(props: LucideIconProps) {
  return <LayoutDashboard size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconUsers(props: LucideIconProps) {
  return <Users size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconUser(props: LucideIconProps) {
  return <UserRound size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconClock(props: LucideIconProps) {
  return <Clock size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconCalendar(props: LucideIconProps) {
  return <CalendarDays size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconPayroll(props: LucideIconProps) {
  return <IndianRupee size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconBell(props: LucideIconProps) {
  return <Bell size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconMenu(props: LucideIconProps) {
  return <Menu size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconClose(props: LucideIconProps) {
  return <X size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}

export function IconSearch(props: LucideIconProps) {
  const { className, ...rest } = props;
  return (
    <Search
      size={20}
      strokeWidth={stroke}
      absoluteStrokeWidth
      className={["opacity-60", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
