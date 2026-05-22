"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isGroupActive, isNavHrefActive } from "@/widgets/sidebar-nav/lib/is-nav-active";
import { NavLinkItem } from "@/widgets/sidebar-nav/ui/nav-link-item";

type Child = { id: string; href: string; label: string };

type Props = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  children: Child[];
  trailing?: React.ReactNode;
};

export function NavCollapse({ label, Icon, children, trailing }: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  const childHrefs = children.map((c) => c.href);
  const groupActive = isGroupActive(pathname, search, childHrefs);
  const [open, setOpen] = useState(groupActive);

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-11 w-full items-center gap-3 rounded-[10px] pl-[14px] pr-3 text-left text-[13px] font-medium tracking-wide transition-colors duration-150 ${
          groupActive
            ? "bg-white/[0.06] text-white"
            : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
        }`}
        aria-expanded={open}
      >
        {groupActive ? (
          <span
            className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-primary shadow-[0_0_14px_rgba(0,112,118,0.65)]"
            aria-hidden
          />
        ) : null}
        <Icon className={`shrink-0 ${groupActive ? "text-white" : "text-slate-400"}`} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-white/[0.08] pb-1 pl-1">
          {children.map((child) => (
            <NavLinkItem
              key={child.id}
              href={child.href}
              label={child.label}
              nested
              active={isNavHrefActive(pathname, search, child.href)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
