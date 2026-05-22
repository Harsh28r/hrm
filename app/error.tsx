"use client";

import { en } from "@/shared/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">{en.errors.generic}</h2>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
