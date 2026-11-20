"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  DollarSign,
  Package,
  Smartphone,
  Truck,
  Warehouse,
} from "lucide-react";
import { formatCents, formatShortDate } from "@/lib/format";

type DashboardData = {
  kpis: {
    totalProducts: number;
    totalStockQuantity: number;
    totalValuationCents: number;
    lowStockCount: number;
    pendingPurchaseOrders: number;
    pendingSalesOrders: number;
    warehouseCount: number;
  };
  lowStockProducts: {
    id: string;
    sku: string;
    barcode: string;
    name: string;
    totalAvailable: number;
    minStockThreshold: number;
  }[];
  warehouseDistribution: {
    id: string;
    code: string;
    name: string;
    location: string;
    skuCount: number;
    units: number;
    valuationCents: number;
  }[];
  recentMovements: {
    id: string;
    type: string;
    productName: string;
    productSku: string;
    fromWarehouseCode: string | null;
    toWarehouseCode: string | null;
    quantityDelta: number;
    reference: string;
    performedBy: string;
    source: string;
    createdAt: string;
  }[];
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load operations dashboard.");
      setData(await res.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("stockflow:refresh", handler);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("stockflow:refresh", handler);
    };
  }, [load]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  }

  const { kpis, lowStockProducts, warehouseDistribution, recentMovements } = data;
  const maxUnits = Math.max(...warehouseDistribution.map((w) => w.units), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Operations Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time stock valuation, warehouse distribution, order queues and mobile-synced movement audit logs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Products &amp; SKUs</span>
          </Link>
          <Link
            href="/warehouses"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Stock Adjust / Transfer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Inventory Valuation (Cost Basis)</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCents(kpis.totalValuationCents)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {kpis.warehouseCount} active warehouses</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Units On Hand</span>
            <Boxes className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalStockQuantity.toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs text-slate-500">{kpis.totalProducts} active catalog SKUs</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Low-Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${kpis.lowStockCount > 0 ? "text-amber-600" : "text-emerald-700"}`}>
            {kpis.lowStockCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">SKUs at or below reorder threshold</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pending Purchase Orders</span>
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.pendingPurchaseOrders}</p>
          <Link href="/orders" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline">
            Receive inbound stock →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pending Sales Orders</span>
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.pendingSalesOrders}</p>
          <Link href="/orders" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline">
            Reserve &amp; fulfil orders →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Warehouses Online</span>
            <Warehouse className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.warehouseCount}</p>
          <Link href="/warehouses" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline">
            Manage storage hubs →
          </Link>
        </div>
      </div>

      {/* Warehouse Distribution + Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Warehouse Stock Distribution</h2>
              <p className="text-xs text-slate-500">On-hand units and cost valuation per distribution hub</p>
            </div>
            <Link href="/warehouses" className="text-xs font-semibold text-emerald-700 hover:underline">
              All warehouses →
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {warehouseDistribution.map((w) => (
              <div key={w.id} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-800">{w.code}</span>{" "}
                    <span className="font-semibold text-slate-900">{w.name}</span>{" "}
                    <span className="text-slate-400">· {w.location}</span>
                  </div>
                  <div className="font-medium text-slate-700">
                    <strong>{w.units.toLocaleString("en-US")}</strong> units · {formatCents(w.valuationCents)}
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${Math.max(4, Math.round((w.units / maxUnits) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Low-Stock Products</h2>
              <p className="text-xs text-slate-500">Available units at or below threshold</p>
            </div>
            <Link href="/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
              Reorder →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center text-xs text-emerald-800">
              All active SKUs are above minimum stock thresholds.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{p.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {p.sku} · EAN {p.barcode}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      {p.totalAvailable} / {p.minStockThreshold}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent Stock Movements */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Stock Movements</h2>
            <p className="text-xs text-slate-500">Immutable PostgreSQL audit log across web and mobile scanner clients</p>
          </div>
          <Link href="/movements" className="text-xs font-semibold text-emerald-700 hover:underline">
            Full audit trail →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2.5">Type</th>
                <th className="pb-2.5">Product</th>
                <th className="pb-2.5">Route</th>
                <th className="pb-2.5">Delta</th>
                <th className="pb-2.5">Source</th>
                <th className="pb-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentMovements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 font-semibold uppercase text-slate-700">{m.type}</td>
                  <td className="py-2.5">
                    <span className="font-semibold text-slate-900">{m.productName}</span>
                    <span className="ml-1.5 font-mono text-slate-400">{m.productSku}</span>
                  </td>
                  <td className="py-2.5 font-mono text-slate-600">
                    {m.fromWarehouseCode && m.toWarehouseCode
                      ? `${m.fromWarehouseCode} → ${m.toWarehouseCode}`
                      : m.toWarehouseCode
                        ? `→ ${m.toWarehouseCode}`
                        : m.fromWarehouseCode
                          ? `${m.fromWarehouseCode} →`
                          : "—"}
                  </td>
                  <td className="py-2.5 font-mono font-bold">
                    <span className={m.quantityDelta >= 0 ? "text-emerald-700" : "text-red-600"}>
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        m.source === "mobile"
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.source === "mobile" ? <Smartphone className="h-3 w-3" /> : null}
                      {m.source}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-400">{formatShortDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

