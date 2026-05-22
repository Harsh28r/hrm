"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPickerUsers } from "@/entities/user";
import type { Employee } from "@/entities/employee/model/types";
import { en } from "@/shared/i18n";

export function EmployeeListTable() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPickerUsers({ search: search || undefined, limit: 100 });
        if (!cancelled) {
          setRows(
            res.users.map((u) => ({
              id: u.id,
              fullName: u.name,
              email: u.email,
            })),
          );
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{en.employees.title}</h2>
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        />
      </div>
      {loading ? (
        <p className="text-sm text-muted">Loading employees…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="p-2 font-medium">{e.fullName}</td>
                <td className="p-2 text-muted">{e.email || "—"}</td>
                <td className="p-2 text-right">
                  <Link href={`/employees/${e.id}`} className="text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
