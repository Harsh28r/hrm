"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/shared/theme/theme-provider";
import { en } from "@/shared/i18n";

export function ThemeToggle() {
  const { preference, setPreference } = useAppTheme();

  return (
    <div
      className="flex items-center rounded-[10px] border border-[color:var(--input-border)] bg-[var(--input-bg)] p-0.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
      role="group"
      aria-label={en.theme.appearanceGroup}
    >
      <button
        type="button"
        onClick={() => setPreference("light")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          preference === "light"
            ? "bg-chrome text-primary shadow-sm dark:bg-chrome-hover dark:text-primary"
            : "text-fg-muted hover:bg-chrome/80 hover:text-heading dark:hover:bg-white/5 dark:hover:text-foreground"
        }`}
        aria-pressed={preference === "light"}
        aria-label={en.theme.light}
        title={en.theme.light}
      >
        <Sun className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setPreference("system")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          preference === "system"
            ? "bg-chrome text-primary shadow-sm dark:bg-chrome-hover dark:text-primary"
            : "text-fg-muted hover:bg-chrome/80 hover:text-heading dark:hover:bg-white/5 dark:hover:text-foreground"
        }`}
        aria-pressed={preference === "system"}
        aria-label={en.theme.system}
        title={en.theme.system}
      >
        <Monitor className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setPreference("dark")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          preference === "dark"
            ? "bg-chrome text-primary shadow-sm dark:bg-chrome-hover dark:text-primary"
            : "text-fg-muted hover:bg-chrome/80 hover:text-heading dark:hover:bg-white/5 dark:hover:text-foreground"
        }`}
        aria-pressed={preference === "dark"}
        aria-label={en.theme.dark}
        title={en.theme.dark}
      >
        <Moon className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
