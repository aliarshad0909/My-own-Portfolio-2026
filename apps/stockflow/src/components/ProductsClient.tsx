"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Barcode, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { PRODUCT_CATEGORIES, formatCents } from "@/lib/format";

type ProductRow = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  description: string;
  unitCostCents: number;
  sellingPriceCents: number;
  minStockThreshold: number;
  status: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  isLowStock: boolean;
  warehouseStock: {
    warehouseId: string;
    warehouseCode: string;
    binLocation: string;
    quantityOnHand: number;
  }[];
};

type WarehouseOpt = { id: string; code: string; name: string };

const EMPTY_FORM = {
  sku: "",
  barcode: "",
  name: "",
  category: "Electronics",
  description: "",
  unitCostDollars: "25.00",
  sellingPriceDollars: "65.00",
  minStockThreshold: 15,
  status: "active",
  initialWarehouseId: "",
  initialQuantity: 20,
  binLocation: "A-01",
};

export function ProductsClient() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (category !== "all") params.set("category", category);
      if (lowStockOnly) params.set("lowStock", "1");
      const res = await fetch(`/api/v1/products?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setProducts(json.products || []);
      setWarehouses(json.warehouses || []);
    } catch {
      toast("Unable to load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, category, lowStockOnly, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("stockflow:refresh", handler);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("stockflow:refresh", handler);
    };
  }, [load]);

  function openCreate() {
    setEditingId(null);
    const rand = Math.floor(1000 + Math.random() * 8999);
    setForm({
      ...EMPTY_FORM,
      sku: `SF-NEW-${rand}`,
      barcode: `890123459${rand}`,
      initialWarehouseId: warehouses[0]?.id ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      description: p.description,
      unitCostDollars: (p.unitCostCents / 100).toFixed(2),
      sellingPriceDollars: (p.sellingPriceCents / 100).toFixed(2),
      minStockThreshold: p.minStockThreshold,
      status: p.status,
      initialWarehouseId: "",
      initialQuantity: 0,
      binLocation: "A-01",
    });
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const unitCostCents = Math.round(Number(form.unitCostDollars || 0) * 100);
      const sellingPriceCents = Math.round(Number(form.sellingPriceDollars || 0) * 100);
      const payload = editingId
        ? {
            sku: form.sku,
            barcode: form.barcode,
            name: form.name,
            category: form.category,
            description: form.description,
            unitCostCents,
            sellingPriceCents,
            minStockThreshold: Number(form.minStockThreshold),
            status: form.status,
          }
        : {
            sku: form.sku,
            barcode: form.barcode,
            name: form.name,
            category: form.category,
            description: form.description,
            unitCostCents,
            sellingPriceCents,
            minStockThreshold: Number(form.minStockThreshold),
            status: form.status,
            initialWarehouseId: form.initialWarehouseId || undefined,
            initialQuantity: Number(form.initialQuantity || 0),
            binLocation: form.binLocation,
          };

      const res = await fetch(editingId ? `/api/v1/products/${editingId}` : "/api/v1/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to save product.", "error");
        return;
      }
      setModalOpen(false);
      toast(editingId ? "Product updated." : "Product created in PostgreSQL.", "success");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to delete product.", "error");
        return;
      }
      setDeleteTarget(null);
      toast("Product deleted.", "info");
      void load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products &amp; SKU Catalog</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage SKUs, EAN-13 barcodes, reorder thresholds, unit costs and warehouse availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search SKU, barcode, product name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm"
          />
        </div>

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="accent-emerald-600"
          />
          <span>Low stock only</span>
        </label>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading catalog…</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No products match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product &amp; SKU</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Cost / Price</th>
                  <th className="px-4 py-3">Warehouses</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">{p.sku}</span> · {p.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1">
                        <Barcode className="h-3.5 w-3.5 text-slate-500" />
                        {p.barcode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-semibold text-slate-900">{formatCents(p.unitCostCents)}</p>
                      <p className="text-slate-500">Sell {formatCents(p.sellingPriceCents)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.warehouseStock.length === 0 ? (
                          <span className="text-xs text-slate-400">No stock assigned</span>
                        ) : (
                          p.warehouseStock.map((ws) => (
                            <span
                              key={ws.warehouseId}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700"
                            >
                              {ws.warehouseCode}: <strong>{ws.quantityOnHand}</strong>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{p.totalAvailable}</span>
                        <span className="text-xs text-slate-400">/ min {p.minStockThreshold}</span>
                      </div>
                      {p.isLowStock ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Product" : "New Product"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-sm">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Product name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">SKU *</span>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Barcode (EAN-13 / Code128) *</span>
                  <input
                    required
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Unit Cost ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitCostDollars}
                    onChange={(e) => setForm((f) => ({ ...f, unitCostDollars: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Selling Price ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sellingPriceDollars}
                    onChange={(e) => setForm((f) => ({ ...f, sellingPriceDollars: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Minimum stock threshold</span>
                  <input
                    type="number"
                    min={0}
                    value={form.minStockThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, minStockThreshold: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </label>
              </div>

              {!editingId ? (
                <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 sm:grid-cols-3">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-700">Opening Warehouse</span>
                    <select
                      value={form.initialWarehouseId}
                      onChange={(e) => setForm((f) => ({ ...f, initialWarehouseId: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} — {w.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Initial Qty</span>
                    <input
                      type="number"
                      min={0}
                      value={form.initialQuantity}
                      onChange={(e) => setForm((f) => ({ ...f, initialQuantity: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product?"
        description={deleteTarget ? `Remove "${deleteTarget.name}" (${deleteTarget.sku}) from catalog?` : ""}
        confirmLabel="Delete Product"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

