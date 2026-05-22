"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { hrmNavItems, isNavGroup, type NavLinkConfig } from "@/widgets/sidebar-nav/config/hrm-nav";
import { isNavHrefActive } from "@/widgets/sidebar-nav/lib/is-nav-active";
import { NavCollapse } from "@/widgets/sidebar-nav/ui/nav-collapse";
import { NavLinkItem } from "@/widgets/sidebar-nav/ui/nav-link-item";

type Props = { pendingLeaveCount: number };

function LeaveBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TopNavLink({
  item,
  active,
  pendingLeaveCount,
}: {
  item: NavLinkConfig;
  active: boolean;
  pendingLeaveCount: number;
}) {
  const badge =
    item.showLeaveBadge && pendingLeaveCount > 0 ? (
      <LeaveBadge count={pendingLeaveCount} />
    ) : undefined;
  return (
    <NavLinkItem href={item.href} label={item.label} active={active} Icon={item.Icon} trailing={badge} />
  );
}

export function SidebarMenu({ pendingLeaveCount }: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 pt-4" aria-label="Main">
      {hrmNavItems.map((item) => {
        if (isNavGroup(item)) {
          return (
            <NavCollapse
              key={item.id}
              label={item.label}
              Icon={item.Icon}
              children={item.children}
            />
          );
        }
        return (
          <TopNavLink
            key={item.id}
            item={item}
            active={isNavHrefActive(pathname, search, item.href)}
            pendingLeaveCount={pendingLeaveCount}
          />
        );
      })}
    </nav>
  );
}
