import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/90 bg-surface px-6 py-14 text-center shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-out hover:border-primary/25 hover:shadow-md motion-safe:hover:-translate-y-0.5"
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-6 transition-transform duration-200 group-hover:translate-y-px">{action}</div>
      ) : null}
    </div>
  );
}
