import { EmployeeListTable } from "@/features/employees/list/ui/employee-list-table";

export default function EmployeesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Employees</h1>
      <EmployeeListTable />
    </div>
  );
}
