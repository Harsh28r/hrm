"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

type Props = {
  href: string;
  label: string;
  active: boolean;
  nested?: boolean;
  Icon?: ComponentType<{ className?: string }>;
  trailing?: ReactNode;
};

export function NavLinkItem({ href, label, active, nested, Icon, trailing }: Props) {
  return (
    <Link
      href={href}
      className={`relative flex items-center rounded-[10px] pr-3 text-[13px] font-medium tracking-wide transition-colors duration-150 ${
        nested ? "h-10 gap-2 pl-9" : "h-11 gap-3 pl-[14px]"
      } ${
        active
          ? nested
            ? "bg-white/[0.08] text-white"
            : "bg-white/[0.085] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
      }`}
    >
      {active && !nested ? (
        <span
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-primary shadow-[0_0_14px_rgba(0,112,118,0.65)]"
          aria-hidden
        />
      ) : null}
      {active && nested ? (
        <span
          className="absolute left-3.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,112,118,0.8)]"
          aria-hidden
        />
      ) : null}
      {Icon ? (
        <Icon className={`shrink-0 ${active ? "text-white" : "text-slate-400"}`} aria-hidden />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </Link>
  );
}
