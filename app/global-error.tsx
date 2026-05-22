"use client";

import { useEffect } from "react";
import { en } from "@/shared/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
        <h1 className="text-xl font-semibold">{en.errors.generic}</h1>
        <p className="mt-2 max-w-md text-center text-sm text-muted">
          {error.message || en.errors.generic}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
