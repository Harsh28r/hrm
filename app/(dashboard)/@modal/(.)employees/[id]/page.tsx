import Link from "next/link";
import { EmployeeViewSheet } from "@/features/employees";

type EmployeeModalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeModalPage({
  params,
}: EmployeeModalPageProps) {
  const { id } = await params;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Employee Quick View</h2>
          <Link href="/employees" className="text-sm text-primary underline">
            Close
          </Link>
        </div>
        <EmployeeViewSheet id={id} />
      </div>
    </div>
  );
}
