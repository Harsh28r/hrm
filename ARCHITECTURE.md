# DeltaYards HRM Frontend Architecture

This project follows a layered Feature-Sliced approach for long-term scale.

## Layer order (strict import direction)

`app -> processes -> widgets -> features -> entities -> shared`

Lower layers never import upper layers.

## Filesystem blueprint

```txt
app/
  (auth)/
  (dashboard)/
    employees/
      [id]/page.tsx
    @modal/
      (.)employees/[id]/page.tsx
      default.tsx
  layout.tsx
  providers.tsx
  error.tsx
  global-error.tsx
  not-found.tsx

processes/
  dashboard-home/

widgets/
  sidebar-nav/

features/
  employees/
    list/
    view/
    index.ts

entities/
  employee/
    api/
    model/
    index.ts

shared/
  api/
  config/
  i18n/
  theme/
  ui/
```

## Conventions

1. `app/*` only composes routes, layouts, loading, and error boundaries.
2. Every feature and entity exposes a public API via `index.ts`.
3. API calls are centralized in `shared/api`.
4. Entity layer owns reusable business nouns (`employee`), feature layer owns actions.
5. Cross-layer imports are lint-restricted in `eslint.config.mjs`.

## Next.js App Router enterprise patterns

- Parallel route slot: `app/(dashboard)/@modal`
- Intercepting route: `app/(dashboard)/@modal/(.)employees/[id]/page.tsx`
- Full-page equivalent: `app/(dashboard)/employees/[id]/page.tsx`
- Canonical route: `app/(dashboard)/employees/[id]/page.tsx` (source of truth for direct links/refresh)

This supports modal detail view without losing list context, while preserving deep-link behavior.

## Pending upgrade path

1. Add BFF route handlers in `app/api/*` if direct API exposure must be reduced.
2. Add React Query provider and hook ownership split:
   - entity queries in `entities/*/api`
   - feature mutations in `features/*`
3. Add `shared/permissions` and TanStack Query key factories when those concerns land.
