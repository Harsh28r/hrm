"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth";
import { useLeavePendingCount } from "@/features/leave";
import { IconBell, IconMenu, IconSearch } from "@/shared/ui/nav-icons";
import { en } from "@/shared/i18n";
import { ThemeToggle } from "@/shared/ui";
import { SidebarMenu } from "@/widgets/sidebar-nav/ui/sidebar-menu";

const LG_BREAKPOINT = 1024;

function useIsLargeScreen() {
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isLg;
}

function initialsFromUser(display: string | undefined, email: string) {
  const base = (display || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return base.slice(0, 2).toUpperCase() || "?";
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { count: pendingLeaveCount } = useLeavePendingCount();
  const pathname = usePathname();
  const isLg = useIsLargeScreen();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(isLg);
  }, [isLg]);

  useEffect(() => {
    if (!isLg) setSidebarOpen(false);
  }, [pathname, isLg]);

  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-svh min-h-0 overflow-hidden bg-[var(--dashboard-canvas)] antialiased">
      {sidebarOpen && !isLg ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          aria-label={en.nav.closeSidebar}
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-svh w-[var(--shell-sidebar-w)] flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#111827_0%,#0b1220_52%,#0a1018_100%)] text-slate-400 shadow-[4px_0_24px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-[var(--ease-out-expo)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen ? true : undefined}
      >
        <div
          className="flex shrink-0 items-center gap-3.5 border-b border-white/[0.07] px-5"
          style={{ height: "var(--shell-header-h, 64px)" }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-[15px] font-bold tracking-tight text-white shadow-[0_8px_24px_-4px_rgba(0,112,118,0.55)]">
            D
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold tracking-tight text-white">DeltaYards</div>
            <div className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              {en.appName}
            </div>
          </div>
        </div>

        <Suspense fallback={<nav className="flex-1 p-3 pt-4" aria-hidden />}>
          <SidebarMenu pendingLeaveCount={pendingLeaveCount} />
        </Suspense>

        <div className="border-t border-white/[0.07] p-3">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex h-11 w-full items-center justify-center rounded-[10px] border border-white/[0.09] bg-white/[0.035] text-[12px] font-semibold tracking-wide text-slate-300 transition-[background-color,border-color,color] hover:border-primary/35 hover:bg-white/[0.06] hover:text-white"
          >
            {en.nav.logout}
          </button>
        </div>
      </aside>

      <div
        className={[
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 ease-[var(--ease-out-expo)]",
          sidebarOpen && isLg ? "lg:pl-[var(--shell-sidebar-w)]" : "",
        ].join(" ")}
      >
        <header
          className="z-20 flex shrink-0 items-center gap-3 border-b bg-[var(--header-bg)] px-4 shadow-[0_1px_0_0_var(--header-line)] backdrop-blur-md md:gap-5 md:px-8"
          style={{
            height: "var(--shell-header-h, 64px)",
            minHeight: "var(--shell-header-h, 64px)",
            maxHeight: "var(--shell-header-h, 64px)",
            borderColor: "var(--header-border)",
          }}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--input-border)] bg-chrome text-fg-muted shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[color,background-color,transform] hover:bg-chrome-hover hover:text-heading active:scale-[0.96] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
            aria-label={sidebarOpen ? en.nav.closeSidebar : en.nav.openSidebar}
            aria-expanded={sidebarOpen}
          >
            <IconMenu />
          </button>
          <div className="relative min-w-0 flex-1 max-w-[min(42rem,100%)]">
            <span className="pointer-events-none absolute left-[14px] top-1/2 z-[1] -translate-y-1/2 text-fg-muted">
              <IconSearch />
            </span>
            <input
              type="search"
              placeholder="Search employees, IDs, requests…"
              className="ui-field h-11 w-full pl-11 pr-4 leading-none"
              aria-label="Search"
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-2.5">
            <ThemeToggle />
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-[10px] border border-[color:var(--input-border)] bg-chrome text-fg-muted shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[color,background-color,transform] hover:bg-chrome-hover hover:text-heading active:scale-[0.96] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
              aria-label="Notifications"
            >
              <IconBell className="text-fg-muted" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--brand-accent)] ring-[3px] ring-chrome dark:ring-chrome-hover" />
            </button>
            <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-[12px] border border-[color:var(--input-border)] bg-[var(--input-bg)] py-1 pl-1 pr-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] outline-offset-2 transition-[border-color,background-color] hover:border-primary/30 hover:bg-chrome/90 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:hover:bg-chrome-hover/80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/12 text-[12px] font-bold tracking-tight text-primary">
                {user ? initialsFromUser(user.displayName ?? user.name, user.email) : "—"}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-[13px] font-semibold leading-tight text-heading">
                  {user?.displayName || user?.name || user?.email || "User"}
                </div>
                <div className="truncate text-[11px] font-medium text-fg-muted">
                  {user?.role ? `${user.role} · ` : ""}
                  DeltaYards
                </div>
              </div>
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
