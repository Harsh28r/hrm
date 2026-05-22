import Link from "next/link";
import { en } from "@/shared/i18n";

export function AuthMobileBrand() {
  return (
    <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-chrome/90 px-4 py-3 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#0b1220]/75 lg:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-offset-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-primary text-sm font-bold tracking-tight text-white shadow-[0_6px_18px_-4px_rgba(0,112,118,0.55)]">
          D
        </span>
        <span className="truncate text-[13px] font-semibold tracking-tight text-heading dark:text-white">{en.appName}</span>
      </Link>
      <Link
        href="/"
        className="shrink-0 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-fg-muted transition-colors hover:text-heading dark:hover:text-white"
      >
        Home
      </Link>
    </header>
  );
}
