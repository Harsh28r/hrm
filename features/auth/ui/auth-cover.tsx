import { CalendarRange, Sparkles, Users } from "lucide-react";
import { en } from "@/shared/i18n";

const stats = [
  { labelKey: "coverStat1Label" as const, valueKey: "coverStat1Value" as const },
  { labelKey: "coverStat2Label" as const, valueKey: "coverStat2Value" as const },
  { labelKey: "coverStat3Label" as const, valueKey: "coverStat3Value" as const },
] as const;

const highlights = [
  { Icon: Users, titleKey: "coverHighlight1Title" as const, bodyKey: "coverHighlight1Body" as const },
  { Icon: CalendarRange, titleKey: "coverHighlight2Title" as const, bodyKey: "coverHighlight2Body" as const },
  { Icon: Sparkles, titleKey: "coverHighlight3Title" as const, bodyKey: "coverHighlight3Body" as const },
] as const;

export function AuthCover() {
  const a = en.auth;

  return (
    <div className="relative z-10 flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-6 pb-6 pt-8 text-foreground sm:px-8 sm:pb-8 sm:pt-10 lg:px-10 lg:pb-6 lg:pt-9 [@media(max-height:760px)]:px-5 [@media(max-height:760px)]:pb-5 [@media(max-height:760px)]:pt-6">
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-primary text-[15px] font-bold tracking-tight text-white shadow-[0_10px_30px_-6px_rgba(0,112,118,0.65)] sm:h-11 sm:w-11 sm:text-[16px] lg:h-10 lg:w-10">
          D
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-primary sm:text-[11px]">
            {a.coverBadge}
          </p>
          <p className="truncate text-[14px] font-semibold tracking-tight text-heading sm:text-[15px]" title={en.appName}>
            {en.appName}
          </p>
        </div>
      </div>

      <div className="mt-5 min-h-0 max-w-full shrink-0 space-y-2 sm:mt-6 sm:space-y-2.5 lg:mt-4 lg:space-y-1.5">
        <h1
          className="line-clamp-2 min-h-0 w-full max-w-full text-balance text-[clamp(1.2rem,2.6vw,2rem)] font-bold leading-[1.12] tracking-[-0.035em] text-heading lg:text-[clamp(1.25rem,2vw,1.75rem)]"
          title={a.coverTitle}
        >
          {a.coverTitle}
        </h1>
        <p
          className="line-clamp-3 min-h-0 max-w-full text-pretty text-[12.5px] leading-snug text-fg-muted sm:text-[13px] lg:text-[12px] lg:leading-relaxed"
          title={a.coverBody}
        >
          {a.coverBody}
        </p>
      </div>

      <dl className="mt-5 grid min-h-0 shrink-0 grid-cols-3 gap-2 sm:mt-6 sm:gap-2.5 lg:mt-4 lg:gap-2">
        {stats.map(({ labelKey, valueKey }) => (
          <div
            key={labelKey}
            className="min-h-0 min-w-0 rounded-lg border border-border/90 bg-surface/80 px-2 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:rounded-xl sm:px-2.5 sm:py-2.5 lg:px-2 lg:py-1.5"
          >
            <dt
              className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-fg-muted sm:text-[10px] lg:text-[8px] lg:leading-tight"
              title={a[labelKey]}
            >
              {a[labelKey]}
            </dt>
            <dd
              className="mt-0.5 truncate text-base font-bold tabular-nums tracking-tight text-heading sm:mt-1 sm:text-lg lg:text-sm"
              title={a[valueKey]}
            >
              {a[valueKey]}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:mt-4 sm:gap-2.5 lg:mt-3 lg:gap-1.5">
        {highlights.map(({ Icon, titleKey, bodyKey }) => {
          const title = a[titleKey];
          const body = a[bodyKey];
          return (
            <li
              key={titleKey}
              className="flex min-h-0 max-h-[3.35rem] min-w-0 shrink-0 gap-2 rounded-lg border border-border/80 bg-surface/50 px-2 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:max-h-[3.75rem] sm:gap-2.5 sm:rounded-xl sm:px-2.5 sm:py-2 lg:max-h-[3.25rem] lg:gap-2 lg:px-2 lg:py-1.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-[9px] bg-primary/15 text-primary ring-1 ring-inset ring-primary/25 sm:h-9 sm:w-9 lg:h-7 lg:w-7">
                <Icon className="h-4 w-4 lg:h-3.5 lg:w-3.5" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-h-0 min-w-0 flex-1 self-center overflow-hidden py-0.5">
                <p className="truncate text-[12px] font-semibold leading-tight tracking-tight text-heading sm:text-[12.5px]" title={title}>
                  {title}
                </p>
                <p
                  className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-fg-muted sm:text-[11.5px] lg:text-[10px] lg:leading-snug"
                  title={body}
                >
                  {body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex min-h-0 min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/80 pt-3 text-[10px] text-fg-muted dark:border-white/[0.07] sm:gap-x-2.5 sm:pt-4 sm:text-[11px] lg:pt-2.5 lg:text-[10px]">
        <span className="max-w-[min(100%,14rem)] truncate font-medium text-fg-subtle" title={a.coverFootnote}>
          {a.coverFootnote}
        </span>
        <span className="hidden h-1 w-1 shrink-0 rounded-full bg-fg-muted sm:inline" aria-hidden />
        <span className="min-w-0 max-w-full flex-1 truncate sm:max-w-[min(100%,18rem)]" title={a.trustBadge}>
          {a.trustBadge}
        </span>
      </div>
    </div>
  );
}
