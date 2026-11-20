"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeftRight, MapPin, Plus, SlidersHorizontal, Warehouse, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatCents } from "@/lib/format";

type WarehouseRow = {
  id: string;
  code: string;
  name: string;
  location: string;
  storageZones: string;
  managerName: string;
  status: string;
  skuCount: number;
  totalUnits: number;
  totalReserved: number;
  valuationCents: number;
};

type ProductOpt = { id: string; sku: string; name: string };

export function WarehousesClient() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [newWhOpen, setNewWhOpen] = useState(false);
  const [whForm, setWhForm] = useState({ code: "", name: "", location: "", storageZones: "Zone A, Dock 1", managerName: "" });

  const [adjForm, setAdjForm] = useState({ productId: "", warehouseId: "", type: "receipt", quantityDelta: 10, note: "" });
  const [trfForm, setTrfForm] = useState({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 5, note: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [wRes, pRes] = await Promise.all([
        fetch("/api/v1/warehouses", { cache: "no-store" }),
        fetch("/api/v1/products", { cache: "no-store" }),
      ]);
      if (wRes.ok && pRes.ok) {
        const wj = await wRes.json();
        const pj = await pRes.json();
        const whs: WarehouseRow[] = wj.warehouses || [];
        const prods: ProductOpt[] = pj.products || [];
        setWarehouses(whs);
        setProducts(prods);
        setAdjForm((f) => ({
          ...f,
          productId: f.productId || prods[0]?.id || "",
          warehouseId: f.warehouseId || whs[0]?.id || "",
        }));
        setTrfForm((f) => ({
          ...f,
          productId: f.productId || prods[0]?.id || "",
          fromWarehouseId: f.fromWarehouseId || whs[0]?.id || "",
          toWarehouseId: f.toWarehouseId || whs[1]?.id || whs[0]?.id || "",
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

  async function handleCreateWarehouse(e: FormEvent) {
    e.preventDefault();
    setBusy("wh");
    try {
      const res = await fetch("/api/v1/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to create warehouse.", "error");
        return;
      }
      setNewWhOpen(false);
      setWhForm({ code: "", name: "", location: "", storageZones: "Zone A, Dock 1", managerName: "" });
      toast("Warehouse created.", "success");
      void load();
    } finally {
      setBusy(null);
    }
  }

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    setBusy("adj");
    try {
      const res = await fetch("/api/v1/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adjForm, source: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Adjustment failed.", "error");
        return;
      }
      toast(`Stock updated cleanly (on-hand now ${data.newQuantityOnHand}).`, "success");
      setAdjForm((f) => ({ ...f, note: "" }));
      void load();
    } finally {
      setBusy(null);
    }
  }

  async function handleTransfer(e: FormEvent) {
    e.preventDefault();
    setBusy("trf");
    try {
      const res = await fetch("/api/v1/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trfForm, source: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Transfer failed.", "error");
        return;
      }
      toast("Inter-warehouse stock transfer recorded.", "success");
      setTrfForm((f) => ({ ...f, note: "" }));
      void load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses &amp; Stock Operations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage distribution locations, record stock receipts/adjustments/issues, and execute atomic inter-warehouse transfers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewWhOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Warehouse</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading warehouses…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800">{w.code}</span>
                  <h2 className="mt-2 text-base font-bold text-slate-900">{w.name}</h2>
                </div>
                <Warehouse className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {w.location}
              </p>
              <p className="mt-2 text-xs text-slate-600">Zones: {w.storageZones}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="block text-slate-400">SKUs</span>
                  <strong className="text-slate-900">{w.skuCount}</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Units</span>
                  <strong className="text-slate-900">{w.totalUnits}</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Value</span>
                  <strong className="text-emerald-700">{formatCents(w.valuationCents)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Operations Forms: Adjust + Transfer */}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleAdjust} className="space-y-3.5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Stock Receipt / Adjustment / Issue</h2>
          </div>
          <p className="text-xs text-slate-500">Updates warehouse stock level and appends an immutable audit record.</p>

          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Product</span>
            <select
              value={adjForm.productId}
              onChange={(e) => setAdjForm((f) => ({ ...f, productId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs sm:col-span-2">
              <span className="font-semibold text-slate-700">Warehouse</span>
              <select
                value={adjForm.warehouseId}
                onChange={(e) => setAdjForm((f) => ({ ...f, warehouseId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Operation</span>
              <select
                value={adjForm.type}
                onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
              >
                <option value="receipt">Receipt (+)</option>
                <option value="adjustment">Adjust (±)</option>
                <option value="issue">Issue (-)</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Quantity</span>
              <input
                type="number"
                required
                value={adjForm.quantityDelta}
                onChange={(e) => setAdjForm((f) => ({ ...f, quantityDelta: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="font-semibold text-slate-700">Reason / Note</span>
              <input
                placeholder="e.g. Cycle count correction or dock delivery"
                value={adjForm.note}
                onChange={(e) => setAdjForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy === "adj"}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy === "adj" ? "Recording…" : "Record Stock Operation"}
          </button>
        </form>

        <form onSubmit={handleTransfer} className="space-y-3.5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Inter-Warehouse Stock Transfer</h2>
          </div>
          <p className="text-xs text-slate-500">Atomically deducts source warehouse stock and credits destination hub.</p>

          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Product</span>
            <select
              value={trfForm.productId}
              onChange={(e) => setTrfForm((f) => ({ ...f, productId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">From warehouse</span>
              <select
                value={trfForm.fromWarehouseId}
                onChange={(e) => setTrfForm((f) => ({ ...f, fromWarehouseId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">To warehouse</span>
              <select
                value={trfForm.toWarehouseId}
                onChange={(e) => setTrfForm((f) => ({ ...f, toWarehouseId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Quantity</span>
              <input
                type="number"
                min={1}
                required
                value={trfForm.quantity}
                onChange={(e) => setTrfForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="font-semibold text-slate-700">Transfer note</span>
              <input
                placeholder="e.g. Rebalance East Coast safety stock"
                value={trfForm.note}
                onChange={(e) => setTrfForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy === "trf"}
            className="w-full rounded-lg bg-[#0c1a17] py-2.5 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-60"
          >
            {busy === "trf" ? "Transferring…" : "Execute Stock Transfer"}
          </button>
        </form>
      </div>

      {/* Create Warehouse Modal */}
      {newWhOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Warehouse</h2>
              <button type="button" onClick={() => setNewWhOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWarehouse} className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Code *</span>
                  <input
                    required
                    placeholder="WH-LAX"
                    value={whForm.code}
                    onChange={(e) => setWhForm((f) => ({ ...f, code: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="col-span-2 block">
                  <span className="text-xs font-semibold text-slate-700">Warehouse name *</span>
                  <input
                    required
                    value={whForm.name}
                    onChange={(e) => setWhForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Location *</span>
                <input
                  required
                  placeholder="Los Angeles, CA"
                  value={whForm.location}
                  onChange={(e) => setWhForm((f) => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Storage zones</span>
                <input
                  value={whForm.storageZones}
                  onChange={(e) => setWhForm((f) => ({ ...f, storageZones: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewWhOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={busy === "wh"} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                  {busy === "wh" ? "Creating…" : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

