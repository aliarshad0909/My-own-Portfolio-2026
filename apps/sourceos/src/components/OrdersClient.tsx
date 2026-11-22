"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Package,
  Plane,
  Plus,
  Ship,
  Truck,
  X,
} from "lucide-react";
import type { DocStatus, DocType, PoStatus, ShipmentMode, ShipmentStatus } from "@/db/schema";
import { useToast } from "@/components/ToastProvider";
import { formatUsdCents } from "@/lib/format";
import { getOrdersSnapshotKey, reconcileRequiredId } from "@/lib/workspace-sync";

type PoRow = {
  id: string;
  poNumber: string;
  supplierId: string;
  rfqId: string | null;
  itemName: string;
  quantity: number;
  unitCostCents: number;
  totalCents: number;
  incoterms: string;
  status: string;
  supplierName: string;
  supplierCountry: string;
};

type ShipmentRow = {
  id: string;
  trackingCode: string;
  poId: string;
  carrier: string;
  mode: string;
  originPort: string;
  destPort: string;
  status: string;
  etaDate: string;
  freightCents: number;
  insuranceCents: number;
  dutyCents: number;
  poNumber: string;
  itemName: string;
  supplierName: string;
};

type DocumentRow = {
  id: string;
  title: string;
  docType: string;
  entityRef: string;
  status: string;
  notes: string;
};

type SupplierOption = {
  id: string;
  name: string;
  country: string;
};

const PO_STAGES: PoStatus[] = ["ordered", "in_production", "shipped", "delivered"];
const SHIPMENT_STAGES: ShipmentStatus[] = ["booked", "in_transit", "customs", "delivered"];
const DOC_STAGES: DocStatus[] = ["pending_review", "submitted", "verified"];

function defaultEtaDate(): string {
  return new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10);
}

function stageBadge(status: string) {
  const map: Record<string, string> = {
    ordered: "border-slate-200 bg-slate-100 text-slate-700",
    in_production: "border-orange-200 bg-orange-50 text-orange-800",
    shipped: "border-sky-200 bg-sky-50 text-sky-700",
    delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    booked: "border-slate-200 bg-slate-100 text-slate-700",
    in_transit: "border-sky-200 bg-sky-50 text-sky-700",
    customs: "border-amber-200 bg-amber-50 text-amber-800",
    pending_review: "border-amber-200 bg-amber-50 text-amber-800",
    submitted: "border-sky-200 bg-sky-50 text-sky-700",
    verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return map[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
}

export function OrdersClient({
  initialPos,
  initialShipments,
  initialDocuments,
  suppliers,
}: {
  initialPos: PoRow[];
  initialShipments: ShipmentRow[];
  initialDocuments: DocumentRow[];
  suppliers: SupplierOption[];
}) {
  const snapshotKey = getOrdersSnapshotKey(
    initialPos,
    initialShipments,
    initialDocuments,
    suppliers,
  );
  return (
    <OrdersWorkspace
      key={snapshotKey}
      initialPos={initialPos}
      initialShipments={initialShipments}
      initialDocuments={initialDocuments}
      suppliers={suppliers}
    />
  );
}

function OrdersWorkspace({
  initialPos,
  initialShipments,
  initialDocuments,
  suppliers,
}: {
  initialPos: PoRow[];
  initialShipments: ShipmentRow[];
  initialDocuments: DocumentRow[];
  suppliers: SupplierOption[];
}) {
  const { notify } = useToast();
  const [pos, setPos] = useState<PoRow[]>(initialPos);
  const [shipmentsList, setShipmentsList] = useState<ShipmentRow[]>(initialShipments);
  const [docs, setDocs] = useState<DocumentRow[]>(initialDocuments);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Toggles for inline creation panels
  const [activeForm, setActiveForm] = useState<"po" | "shipment" | "doc" | null>(null);

  // New PO state
  const [poSupplierId, setPoSupplierId] = useState<string>(() =>
    reconcileRequiredId(null, suppliers),
  );
  const [poItemName, setPoItemName] = useState("");
  const [poQty, setPoQty] = useState("500");
  const [poUnitUsd, setPoUnitUsd] = useState("48.00");
  const [poIncoterms, setPoIncoterms] = useState("FOB");

  // New Shipment state
  const [shipPoId, setShipPoId] = useState<string>(() =>
    reconcileRequiredId(null, initialPos),
  );
  const [shipCarrier, setShipCarrier] = useState("MSC Mediterranean Shipping");
  const [shipMode, setShipMode] = useState<ShipmentMode>("sea");
  const [shipOrigin, setShipOrigin] = useState("Hamburg (DEHAM)");
  const [shipDest, setShipDest] = useState("Savannah (USSAV)");
  const [shipEta, setShipEta] = useState(() => defaultEtaDate());
  const [shipFreightUsd, setShipFreightUsd] = useState("3450");
  const [shipInsUsd, setShipInsUsd] = useState("420");
  const [shipDutyUsd, setShipDutyUsd] = useState("1850");

  // New Document state
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("commercial_invoice");
  const [docEntityRef, setDocEntityRef] = useState(initialPos[0]?.poNumber ?? "PO-2026-4410");
  const [docNotes, setDocNotes] = useState("");

  async function advancePoStatus(po: PoRow, nextStatus: PoStatus) {
    setBusyId(po.id);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to update PO status.", "error");
        return;
      }
      setPos((prev) => prev.map((p) => (p.id === po.id ? { ...p, status: data.purchaseOrder.status } : p)));
      notify(`${po.poNumber} moved to "${nextStatus.replace("_", " ")}".`);
    } finally {
      setBusyId(null);
    }
  }

  async function advanceShipmentStatus(s: ShipmentRow, nextStatus: ShipmentStatus) {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/shipments/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to update shipment status.", "error");
        return;
      }
      setShipmentsList((prev) =>
        prev.map((row) => (row.id === s.id ? { ...row, status: data.shipment.status } : row)),
      );
      notify(`Shipment ${s.trackingCode} updated to "${nextStatus.replace("_", " ")}".`);
    } finally {
      setBusyId(null);
    }
  }

  async function updateDocumentStatus(doc: DocumentRow, nextStatus: DocStatus) {
    setBusyId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to update document status.", "error");
        return;
      }
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? data.document : d)));
      notify(`Document marked as "${nextStatus.replace("_", " ")}".`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreatePo(e: FormEvent) {
    e.preventDefault();
    setBusyId("create-po");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poSupplierId,
          itemName: poItemName,
          quantity: Number(poQty),
          unitCostCents: Math.round(Number(poUnitUsd) * 100),
          incoterms: poIncoterms,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Failed to issue Purchase Order.", "error");
        return;
      }
      const sup = suppliers.find((s) => s.id === poSupplierId);
      setPos((prev) => [
        {
          ...data.purchaseOrder,
          supplierName: sup?.name ?? "Unknown Supplier",
          supplierCountry: sup?.country ?? "—",
        },
        ...prev,
      ]);
      setPoItemName("");
      setActiveForm(null);
      notify(`Issued Purchase Order ${data.purchaseOrder.poNumber}.`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateShipment(e: FormEvent) {
    e.preventDefault();
    setBusyId("create-ship");
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId: shipPoId,
          carrier: shipCarrier,
          mode: shipMode,
          originPort: shipOrigin,
          destPort: shipDest,
          etaDate: shipEta,
          freightCents: Math.round(Number(shipFreightUsd) * 100),
          insuranceCents: Math.round(Number(shipInsUsd) * 100),
          dutyCents: Math.round(Number(shipDutyUsd) * 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Failed to book shipment.", "error");
        return;
      }
      const po = pos.find((p) => p.id === shipPoId);
      setShipmentsList((prev) => [
        {
          ...data.shipment,
          poNumber: po?.poNumber ?? "N/A",
          itemName: po?.itemName ?? "Cargo",
          supplierName: po?.supplierName ?? "Supplier",
        },
        ...prev,
      ]);
      setActiveForm(null);
      notify(`Booked shipment ${data.shipment.trackingCode}.`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateDoc(e: FormEvent) {
    e.preventDefault();
    setBusyId("create-doc");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          docType,
          entityRef: docEntityRef,
          status: "pending_review",
          notes: docNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Failed to log document.", "error");
        return;
      }
      setDocs((prev) => [data.document, ...prev]);
      setDocTitle("");
      setDocNotes("");
      setActiveForm(null);
      notify(`Logged trade document "${data.document.title}".`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">
            Order Fulfillment, Freight &amp; Trade Compliance
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f1d33]">
            Purchase Orders, Shipments &amp; Documents
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Track manufacturing milestones, advance container &amp; air-freight clearances, and
            verify required customs documentation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveForm(activeForm === "po" ? null : "po")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#ea580c] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#c2410c]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New PO</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveForm(activeForm === "shipment" ? null : "shipment")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f1d33] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#192d4d]"
          >
            <Ship className="h-3.5 w-3.5 text-[#f97316]" />
            <span>Book Shipment</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveForm(activeForm === "doc" ? null : "doc")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#0f1d33] hover:bg-slate-50"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-[#ea580c]" />
            <span>Add Trade Doc</span>
          </button>
        </div>
      </div>

      {/* Inline Creation Forms */}
      {activeForm === "po" ? (
        <form
          onSubmit={handleCreatePo}
          className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f1d33]">Issue Direct Purchase Order</h2>
            <button type="button" onClick={() => setActiveForm(null)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Supplier *</label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Item Description *</label>
              <input
                required
                value={poItemName}
                onChange={(e) => setPoItemName(e.target.value)}
                placeholder="e.g., CNC Anodized Control Plates"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Qty &amp; Unit USD</label>
              <div className="mt-1 flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  required
                  value={poQty}
                  onChange={(e) => setPoQty(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  value={poUnitUsd}
                  onChange={(e) => setPoUnitUsd(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Incoterms</label>
              <select
                value={poIncoterms}
                onChange={(e) => setPoIncoterms(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
              >
                {["EXW", "FCA", "FOB", "CIF", "DAP", "DDP"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={busyId === "create-po"}
              className="rounded-lg bg-[#ea580c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c2410c]"
            >
              {busyId === "create-po" ? "Issuing…" : "Issue Purchase Order"}
            </button>
          </div>
        </form>
      ) : null}

      {activeForm === "shipment" ? (
        <form
          onSubmit={handleCreateShipment}
          className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f1d33]">Book Freight Shipment</h2>
            <button type="button" onClick={() => setActiveForm(null)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Purchase Order *</label>
              <select
                value={shipPoId}
                onChange={(e) => setShipPoId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
              >
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.poNumber} — {p.supplierName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Carrier *</label>
              <input
                required
                value={shipCarrier}
                onChange={(e) => setShipCarrier(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Transport Mode</label>
              <select
                value={shipMode}
                onChange={(e) => setShipMode(e.target.value as ShipmentMode)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
              >
                <option value="sea">Sea Freight</option>
                <option value="air">Air Cargo</option>
                <option value="express">Express Courier</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">ETA Date *</label>
              <input
                type="date"
                required
                value={shipEta}
                onChange={(e) => setShipEta(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Origin Port *</label>
              <input
                required
                value={shipOrigin}
                onChange={(e) => setShipOrigin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Destination Port *</label>
              <input
                required
                value={shipDest}
                onChange={(e) => setShipDest(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Freight / Ins. (USD)
              </label>
              <div className="mt-1 flex gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={shipFreightUsd}
                  onChange={(e) => setShipFreightUsd(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  value={shipInsUsd}
                  onChange={(e) => setShipInsUsd(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Est. Duty (USD)</label>
              <input
                type="number"
                min={0}
                value={shipDutyUsd}
                onChange={(e) => setShipDutyUsd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={busyId === "create-ship"}
              className="rounded-lg bg-[#0f1d33] px-4 py-2 text-xs font-semibold text-white hover:bg-[#192d4d]"
            >
              {busyId === "create-ship" ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
        </form>
      ) : null}

      {activeForm === "doc" ? (
        <form
          onSubmit={handleCreateDoc}
          className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f1d33]">Log Trade &amp; Compliance Document</h2>
            <button type="button" onClick={() => setActiveForm(null)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Document Title *</label>
              <input
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g., Commercial Invoice — Inverter Lot #9"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
              >
                <option value="commercial_invoice">Commercial Invoice</option>
                <option value="packing_list">Packing List</option>
                <option value="bill_of_lading">Bill of Lading</option>
                <option value="certificate_of_origin">Certificate of Origin</option>
                <option value="qc_report">QC Inspection Report</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">PO / Shipment Ref *</label>
              <input
                required
                value={docEntityRef}
                onChange={(e) => setDocEntityRef(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700">Compliance Notes</label>
              <input
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="HTS classification note, customs broker reference, or QA AQL check…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={busyId === "create-doc"}
              className="rounded-lg bg-[#0f1d33] px-4 py-2 text-xs font-semibold text-white hover:bg-[#192d4d]"
            >
              {busyId === "create-doc" ? "Saving…" : "Add to Compliance Checklist"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Section 1: Purchase Orders Lifecycle */}
      <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#ea580c]" />
            <h2 className="text-base font-bold text-[#0f1d33]">
              Purchase Orders Lifecycle ({pos.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Ordered → In Production → Shipped → Delivered
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 pr-3 font-semibold">PO Number</th>
                <th className="pb-2.5 pr-3 font-semibold">Supplier &amp; Item</th>
                <th className="pb-2.5 pr-3 font-semibold">Qty × Unit</th>
                <th className="pb-2.5 pr-3 font-semibold">Total Value</th>
                <th className="pb-2.5 pr-3 font-semibold">Incoterms</th>
                <th className="pb-2.5 pr-3 font-semibold">Status</th>
                <th className="pb-2.5 text-right font-semibold">Update Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3 font-mono font-bold text-[#0f1d33]">{po.poNumber}</td>
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-[#0f1d33]">{po.itemName}</p>
                    <p className="text-[11px] text-slate-500">
                      {po.supplierName} ({po.supplierCountry})
                    </p>
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-700">
                    {po.quantity.toLocaleString()} × {formatUsdCents(po.unitCostCents)}
                  </td>
                  <td className="py-3 pr-3 font-mono font-bold text-[#0f1d33]">
                    {formatUsdCents(po.totalCents)}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                      {po.incoterms}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${stageBadge(po.status)}`}
                    >
                      {po.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <select
                      aria-label={`Update status for ${po.poNumber}`}
                      disabled={busyId === po.id}
                      value={po.status}
                      onChange={(e) => advancePoStatus(po, e.target.value as PoStatus)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-[#0f1d33]"
                    >
                      {PO_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Shipment Tracking & Freight Management */}
      <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-[#ea580c]" />
            <h2 className="text-base font-bold text-[#0f1d33]">
              Shipment Tracking &amp; Freight Management ({shipmentsList.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Booked → In Transit → Customs → Delivered</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 pr-3 font-semibold">Tracking / PO</th>
                <th className="pb-2.5 pr-3 font-semibold">Carrier &amp; Mode</th>
                <th className="pb-2.5 pr-3 font-semibold">Port Corridor</th>
                <th className="pb-2.5 pr-3 font-semibold">ETA</th>
                <th className="pb-2.5 pr-3 font-semibold">Freight / Ins / Duty</th>
                <th className="pb-2.5 pr-3 font-semibold">Status</th>
                <th className="pb-2.5 text-right font-semibold">Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipmentsList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3">
                    <p className="font-mono font-bold text-[#0f1d33]">{s.trackingCode}</p>
                    <p className="text-[11px] text-slate-500">{s.poNumber}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0f1d33]">
                      {s.mode === "air" ? (
                        <Plane className="h-3.5 w-3.5 text-sky-600" />
                      ) : s.mode === "express" ? (
                        <Truck className="h-3.5 w-3.5 text-[#ea580c]" />
                      ) : (
                        <Ship className="h-3.5 w-3.5 text-[#0f1d33]" />
                      )}
                      <span>{s.carrier}</span>
                    </div>
                    <p className="text-[11px] uppercase text-slate-500">{s.mode}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-800">{s.originPort}</p>
                    <p className="text-[11px] text-slate-500">→ {s.destPort}</p>
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-700">{s.etaDate}</td>
                  <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">
                    {formatUsdCents(s.freightCents)} / {formatUsdCents(s.insuranceCents)} /{" "}
                    {formatUsdCents(s.dutyCents)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${stageBadge(s.status)}`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <select
                      aria-label={`Update shipment status for ${s.trackingCode}`}
                      disabled={busyId === s.id}
                      value={s.status}
                      onChange={(e) =>
                        advanceShipmentStatus(s, e.target.value as ShipmentStatus)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-[#0f1d33]"
                    >
                      {SHIPMENT_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Trade Document Management Checklist */}
      <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#ea580c]" />
            <h2 className="text-base font-bold text-[#0f1d33]">
              Trade Document Compliance Checklist ({docs.length})
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {docs.filter((d) => d.status === "verified").length} of {docs.length} verified
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#0f1d33]">
                    {doc.docType.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${stageBadge(doc.status)}`}
                  >
                    {doc.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#0f1d33]">{doc.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[#ea580c]">Ref: {doc.entityRef}</p>
                {doc.notes ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{doc.notes}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-2.5">
                {DOC_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    disabled={busyId === doc.id || doc.status === stage}
                    onClick={() => updateDocumentStatus(doc, stage)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                      doc.status === stage
                        ? "bg-[#0f1d33] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:text-[#ea580c]"
                    }`}
                  >
                    {stage.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
