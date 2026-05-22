import Link from "next/link";
import { en } from "@/shared/i18n";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Page not found</h1>
      <Link href="/" className="mt-6 text-sm font-medium text-primary underline">
        ← {en.nav.home}
      </Link>
    </div>
  );
}
