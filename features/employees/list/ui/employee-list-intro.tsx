import { EmptyState } from "@/shared/ui";
import { isApiConfigured } from "@/shared/config";
import { en } from "@/shared/i18n";

export function EmployeeListIntro() {
  const apiReady = isApiConfigured();

  if (!apiReady) {
    return (
      <EmptyState
        title="Cannot load employees"
        description="Set NEXT_PUBLIC_API_BASE_URL, then map entities/employee/api to your backend contract."
      />
    );
  }

  return (
    <section className="rounded-2xl border border-border/90 bg-surface p-6 shadow-sm transition-[box-shadow,transform] duration-300 hover:shadow-md motion-safe:hover:-translate-y-px">
      <h2 className="text-lg font-bold tracking-tight text-foreground">{en.employees.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{en.employees.subtitle}</p>
    </section>
  );
}
