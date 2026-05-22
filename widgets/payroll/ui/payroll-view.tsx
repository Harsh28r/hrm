"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPayrollRun,
  fetchPayrollRuns,
  fetchPayslips,
  lockPayrollRun,
  type PayrollRun,
  type PayslipListItem,
} from "@/entities/payroll";

export function PayrollView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [slips, setSlips] = useState<PayslipListItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPayrollRuns();
      setRuns(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const runMonth = async () => {
    try {
      await createPayrollRun(month, year);
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    }
  };

  const lock = async (id: string) => {
    try {
      await lockPayrollRun(id);
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lock failed");
    }
  };

  const viewSlips = async (id: string) => {
    setSelectedRun(id);
    const res = await fetchPayslips(id);
    setSlips(res.data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="text-sm">
          Month
          <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(+e.target.value)} className="ml-2 rounded border px-2 py-1" />
        </label>
        <label className="text-sm">
          Year
          <input type="number" value={year} onChange={(e) => setYear(+e.target.value)} className="ml-2 rounded border px-2 py-1" />
        </label>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-white" onClick={runMonth}>
          Generate run
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="p-2">Period</th>
              <th className="p-2">Status</th>
              <th className="p-2">Employees</th>
              <th className="p-2">Gross</th>
              <th className="p-2">Net</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r._id} className="border-b">
                <td className="p-2">
                  {r.month}/{r.year}
                </td>
                <td className="p-2 capitalize">{r.status}</td>
                <td className="p-2">{r.employeeCount}</td>
                <td className="p-2">₹{r.totalGross?.toLocaleString()}</td>
                <td className="p-2">₹{r.totalNet?.toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button type="button" className="text-primary underline" onClick={() => viewSlips(r._id)}>
                    Payslips
                  </button>
                  {r.status === "draft" && (
                    <button type="button" className="text-primary underline" onClick={() => lock(r._id)}>
                      Lock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedRun && slips.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-3 font-medium">Payslips (PF / ESI / PT / TDS)</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted">
                <th className="p-1 text-left">Employee</th>
                <th className="p-1">Days</th>
                <th className="p-1">LOP</th>
                <th className="p-1">Gross</th>
                <th className="p-1">PF</th>
                <th className="p-1">ESI</th>
                <th className="p-1">PT</th>
                <th className="p-1">TDS</th>
                <th className="p-1">Net</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => (
                <tr key={s._id} className="border-b">
                  <td className="p-1">{s.user?.name}</td>
                  <td className="p-1 text-center">{s.payableDays}</td>
                  <td className="p-1 text-center">{s.lopDays}</td>
                  <td className="p-1 text-right">₹{s.gross}</td>
                  <td className="p-1 text-right">{s.statutory?.pfEmployee ?? 0}</td>
                  <td className="p-1 text-right">{s.statutory?.esiEmployee ?? 0}</td>
                  <td className="p-1 text-right">{s.statutory?.pt ?? 0}</td>
                  <td className="p-1 text-right">{s.statutory?.tds ?? 0}</td>
                  <td className="p-1 text-right font-medium">₹{s.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
