"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { formatShortDate } from "@/lib/format";

type MovementRow = {
  id: string;
  type: string;
  productName: string;
  productSku: string;
  fromWarehouseCode: string | null;
  toWarehouseCode: string | null;
  quantityDelta: number;
  reference: string;
  note: string;
  performedBy: string;
  source: string;
  createdAt: string;
};

export function MovementsClient() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`/api/v1/movements?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setRows(json.movements || []);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, sourceFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("stockflow:refresh", handler);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("stockflow:refresh", handler);
    };
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Audit Trail</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every stock receipt, cycle-count adjustment, inter-warehouse transfer, reservation and fulfilment recorded in PostgreSQL.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
        <select
          aria-label="Filter movement type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All movement types</option>
          <option value="receipt">Receipts</option>
          <option value="adjustment">Adjustments</option>
          <option value="transfer">Transfers</option>
          <option value="issue">Issues</option>
          <option value="reservation">Reservations</option>
          <option value="fulfilment">Fulfilments</option>
        </select>

        <select
          aria-label="Filter client source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All sources (Web + Mobile)</option>
          <option value="web">Web Dashboard</option>
          <option value="mobile">Expo Mobile App</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading audit trail…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No stock movements match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouses</th>
                  <th className="px-4 py-3">Delta</th>
                  <th className="px-4 py-3">Reference &amp; Note</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold uppercase text-slate-800">{m.type}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{m.productName}</p>
                      <p className="font-mono text-slate-400">{m.productSku}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {m.fromWarehouseCode && m.toWarehouseCode
                        ? `${m.fromWarehouseCode} → ${m.toWarehouseCode}`
                        : m.toWarehouseCode
                          ? `→ ${m.toWarehouseCode}`
                          : m.fromWarehouseCode
                            ? `${m.fromWarehouseCode} →`
                            : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={m.quantityDelta >= 0 ? "text-emerald-700" : "text-red-600"}>
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-slate-700">{m.reference || "—"}</p>
                      <p className="text-slate-500">{m.note || m.performedBy}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          m.source === "mobile"
                            ? "border border-teal-200 bg-teal-50 text-teal-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.source === "mobile" ? <Smartphone className="h-3 w-3" /> : null}
                        {m.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatShortDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

