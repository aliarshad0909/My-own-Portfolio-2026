"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, PackageCheck, Plus, Truck, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatCents, formatShortDate } from "@/lib/format";

type PO = {
  id: string;
  orderNumber: string;
  supplierName: string;
  warehouseCode: string;
  status: string;
  expectedDate: string;
  notes: string;
  totalCents: number;
  items: { id: string; productSku: string; productName: string; quantityOrdered: number; quantityReceived: number; unitCostCents: number }[];
};

type SO = {
  id: string;
  orderNumber: string;
  customerName: string;
  warehouseCode: string;
  status: string;
  trackingCarrier: string;
  trackingNumber: string;
  deliveryStatus: string;
  totalCents: number;
  createdAt: string;
  items: { id: string; productSku: string; productName: string; quantity: number; unitPriceCents: number }[];
};

type NamedOpt = { id: string; name: string; code?: string; sku?: string; unitCostCents?: number; sellingPriceCents?: number };

export function OrdersClient() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"purchase" | "sales">("purchase");
  const [purchaseOrders, setPOs] = useState<PO[]>([]);
  const [salesOrders, setSOs] = useState<SO[]>([]);
  const [suppliers, setSuppliers] = useState<NamedOpt[]>([]);
  const [customers, setCustomers] = useState<NamedOpt[]>([]);
  const [warehouses, setWarehouses] = useState<NamedOpt[]>([]);
  const [products, setProducts] = useState<NamedOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [poOpen, setPoOpen] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: "", warehouseId: "", productId: "", quantityOrdered: 25, notes: "" });

  const [soOpen, setSoOpen] = useState(false);
  const [soForm, setSoForm] = useState({ customerId: "", warehouseId: "", productId: "", quantity: 5, notes: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [poRes, soRes] = await Promise.all([
        fetch("/api/v1/purchase-orders", { cache: "no-store" }),
        fetch("/api/v1/sales-orders", { cache: "no-store" }),
      ]);
      if (poRes.ok && soRes.ok) {
        const pj = await poRes.json();
        const sj = await soRes.json();
        setPOs(pj.purchaseOrders || []);
        setSuppliers(pj.suppliers || []);
        setWarehouses(pj.warehouses || []);
        setProducts(pj.products || []);
        setSOs(sj.salesOrders || []);
        setCustomers(sj.customers || []);

        setPoForm((f) => ({
          ...f,
          supplierId: f.supplierId || pj.suppliers?.[0]?.id || "",
          warehouseId: f.warehouseId || pj.warehouses?.[0]?.id || "",
          productId: f.productId || pj.products?.[0]?.id || "",
        }));
        setSoForm((f) => ({
          ...f,
          customerId: f.customerId || sj.customers?.[0]?.id || "",
          warehouseId: f.warehouseId || sj.warehouses?.[0]?.id || "",
          productId: f.productId || sj.products?.[0]?.id || "",
        }));
      }
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

  async function handleCreatePO(e: FormEvent) {
    e.preventDefault();
    setBusyId("new-po");
    try {
      const prod = products.find((p) => p.id === poForm.productId);
      const res = await fetch("/api/v1/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poForm.supplierId,
          warehouseId: poForm.warehouseId,
          notes: poForm.notes,
          items: [
            {
              productId: poForm.productId,
              quantityOrdered: Number(poForm.quantityOrdered),
              unitCostCents: prod?.unitCostCents ?? 1500,
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to create purchase order.", "error");
        return;
      }
      setPoOpen(false);
      toast(`Purchase Order ${data.purchaseOrder?.orderNumber} created.`, "success");
      void load();
    } finally {
      setBusyId(null);
    }
  }

  async function receivePO(po: PO) {
    setBusyId(po.id);
    try {
      const res = await fetch(`/api/v1/purchase-orders/${po.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to receive purchase order.", "error");
        return;
      }
      toast(`${po.orderNumber} received — warehouse inventory updated.`, "success");
      void load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateSO(e: FormEvent) {
    e.preventDefault();
    setBusyId("new-so");
    try {
      const prod = products.find((p) => p.id === soForm.productId);
      const res = await fetch("/api/v1/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: soForm.customerId,
          warehouseId: soForm.warehouseId,
          notes: soForm.notes,
          items: [
            {
              productId: soForm.productId,
              quantity: Number(soForm.quantity),
              unitPriceCents: prod?.sellingPriceCents ?? 4500,
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to create sales order.", "error");
        return;
      }
      setSoOpen(false);
      toast(`Sales Order ${data.salesOrder?.orderNumber} created.`, "success");
      void load();
    } finally {
      setBusyId(null);
    }
  }

  async function runSoAction(so: SO, action: "reserve" | "fulfil" | "ship") {
    setBusyId(`${so.id}-${action}`);
    try {
      const res = await fetch(`/api/v1/sales-orders/${so.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Action failed.", "error");
        return;
      }
      toast(`${so.orderNumber} updated to "${data.salesOrder?.status}".`, "success");
      void load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase &amp; Sales Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Receive supplier stock directly into warehouse bins and manage customer reservations, fulfilment and dispatch tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPoOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Purchase Order</span>
          </button>
          <button
            type="button"
            onClick={() => setSoOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0c1a17] px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Sales Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab("purchase")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "purchase" ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("sales")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "sales" ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Sales Orders ({salesOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading orders…</div>
      ) : tab === "purchase" ? (
        <div className="space-y-3">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900">{po.orderNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        po.status === "received"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Supplier: <strong>{po.supplierName}</strong> · Receiving Hub: <strong className="font-mono">{po.warehouseCode}</strong> · ETA{" "}
                    {po.expectedDate || "TBD"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{formatCents(po.totalCents)}</span>
                  {po.status !== "received" && po.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={busyId === po.id}
                      onClick={() => void receivePO(po)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>{busyId === po.id ? "Receiving…" : "Receive Stock"}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
                {po.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-1.5">
                    <span>
                      <strong className="font-mono text-slate-700">{item.productSku}</strong> {item.productName}
                    </span>
                    <span className="font-mono text-slate-600">
                      {item.quantityReceived}/{item.quantityOrdered} recv · {formatCents(item.unitCostCents)} ea
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {salesOrders.map((so) => (
            <div key={so.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900">{so.orderNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        so.status === "shipped"
                          ? "bg-emerald-50 text-emerald-700"
                          : so.status === "fulfilled"
                            ? "bg-teal-50 text-teal-700"
                            : so.status === "reserved"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {so.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Customer: <strong>{so.customerName}</strong> · Warehouse: <strong className="font-mono">{so.warehouseCode}</strong> · Created{" "}
                    {formatShortDate(so.createdAt)}
                  </p>
                  {so.trackingNumber ? (
                    <p className="mt-1 font-mono text-[11px] text-emerald-700">
                      Tracking: {so.trackingCarrier} · {so.trackingNumber}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-bold text-slate-900">{formatCents(so.totalCents)}</span>
                  {so.status === "pending" ? (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void runSoAction(so, "reserve")}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Reserve Stock
                    </button>
                  ) : null}
                  {so.status === "pending" || so.status === "reserved" ? (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void runSoAction(so, "fulfil")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Fulfil</span>
                    </button>
                  ) : null}
                  {so.status === "fulfilled" ? (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void runSoAction(so, "ship")}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0c1a17] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Mark Shipped</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
                {so.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-1.5">
                    <span>
                      <strong className="font-mono text-slate-700">{item.productSku}</strong> {item.productName}
                    </span>
                    <span className="font-mono text-slate-600">
                      {item.quantity} units × {formatCents(item.unitPriceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* New PO Modal */}
      {poOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create Purchase Order</h2>
              <button type="button" onClick={() => setPoOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Supplier</span>
                <select
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm((f) => ({ ...f, supplierId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Receiving Warehouse</span>
                <select
                  value={poForm.warehouseId}
                  onChange={(e) => setPoForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 block">
                  <span className="text-xs font-semibold text-slate-700">Product</span>
                  <select
                    value={poForm.productId}
                    onChange={(e) => setPoForm((f) => ({ ...f, productId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Qty</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poForm.quantityOrdered}
                    onChange={(e) => setPoForm((f) => ({ ...f, quantityOrdered: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPoOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={busyId === "new-po"} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* New SO Modal */}
      {soOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create Sales Order</h2>
              <button type="button" onClick={() => setSoOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSO} className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Customer</span>
                <select
                  value={soForm.customerId}
                  onChange={(e) => setSoForm((f) => ({ ...f, customerId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Fulfilment Warehouse</span>
                <select
                  value={soForm.warehouseId}
                  onChange={(e) => setSoForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 block">
                  <span className="text-xs font-semibold text-slate-700">Product</span>
                  <select
                    value={soForm.productId}
                    onChange={(e) => setSoForm((f) => ({ ...f, productId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Qty</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={soForm.quantity}
                    onChange={(e) => setSoForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSoOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={busyId === "new-so"} className="rounded-lg bg-[#0c1a17] px-4 py-2 text-xs font-semibold text-white">
                  Create SO
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

