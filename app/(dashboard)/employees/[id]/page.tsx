import { EmployeeViewSheet } from "@/features/employees";

type EmployeeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl">
      <EmployeeViewSheet id={id} />
    </div>
  );
}
