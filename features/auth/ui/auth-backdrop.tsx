/** Full-viewport canvas — colors from `app/globals.css` (`--auth-*`, theme-aware gradient). */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="auth-backdrop-base absolute inset-0" />
      <div className="absolute -left-[12%] top-[-14%] h-[min(85vw,640px)] w-[min(85vw,640px)] rounded-full blur-3xl bg-[color-mix(in_oklab,var(--brand-primary)_18%,transparent)] dark:bg-primary/20" />
      <div className="absolute -right-[10%] bottom-[-18%] h-[min(75vw,560px)] w-[min(75vw,560px)] rounded-full blur-3xl bg-[color-mix(in_oklab,var(--brand-secondary)_14%,transparent)] dark:bg-[#003399]/32" />
      <div
        className="absolute inset-0 opacity-[var(--auth-grid-opacity)] dark:hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%230f172a' stroke-width='0.5'%3E%3Cpath d='M0 20h40M20 0v40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-[var(--auth-grid-opacity)] dark:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 20h40M20 0v40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `var(--auth-radial)`,
        }}
      />
    </div>
  );
}
