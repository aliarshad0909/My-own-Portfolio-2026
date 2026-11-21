"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Send,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatPct, formatUsdCents } from "@/lib/format";

type QuoteItem = {
  id: string;
  rfqId: string;
  supplierId: string;
  unitPriceCents: number;
  moq: number;
  leadTimeDays: number;
  incoterms: string;
  freightEstimateCents: number;
  selected: boolean;
  notes: string;
  supplierName: string;
  supplierCountry: string;
  supplierRating: number;
  supplierOnTimePct: number;
  supplierStatus: string;
  estimatedTotalCents: number;
};

type RfqItem = {
  id: string;
  rfqNumber: string;
  title: string;
  targetQty: number;
  targetUnitCents: number;
  currency: string;
  status: string;
  dueDate: string;
  notes: string;
  quotations: QuoteItem[];
};

type SupplierOption = {
  id: string;
  name: string;
  country: string;
  qualificationStatus: string;
};

function defaultFutureDate(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function RfqsClient({
  initialRfqs,
  suppliers,
}: {
  initialRfqs: RfqItem[];
  suppliers: SupplierOption[];
}) {
  const { notify } = useToast();
  const [rfqList, setRfqList] = useState<RfqItem[]>(initialRfqs);
  const [selectedRfqId, setSelectedRfqId] = useState<string>(initialRfqs[0]?.id ?? "");
  const [showNewRfq, setShowNewRfq] = useState(false);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [busyAwardId, setBusyAwardId] = useState<string | null>(null);
  const [lastCreatedPo, setLastCreatedPo] = useState<{ poNumber: string; supplierName: string } | null>(
    null,
  );

  // Create RFQ form
  const [rfqTitle, setRfqTitle] = useState("");
  const [targetQty, setTargetQty] = useState("1000");
  const [targetUnitUsd, setTargetUnitUsd] = useState("42.00");
  const [dueDate, setDueDate] = useState(() => defaultFutureDate(18));
  const [rfqNotes, setRfqNotes] = useState("");
  const [savingRfq, setSavingRfq] = useState(false);

  // Submit Quotation form
  const [quoteSupplierId, setQuoteSupplierId] = useState(suppliers[0]?.id ?? "");
  const [quoteUnitUsd, setQuoteUnitUsd] = useState("43.50");
  const [quoteMoq, setQuoteMoq] = useState("500");
  const [quoteLeadDays, setQuoteLeadDays] = useState("20");
  const [quoteIncoterms, setQuoteIncoterms] = useState("FOB");
  const [quoteFreightUsd, setQuoteFreightUsd] = useState("3200");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  const activeRfq = useMemo(
    () => rfqList.find((r) => r.id === selectedRfqId) ?? rfqList[0] ?? null,
    [rfqList, selectedRfqId],
  );

  const lowestTotal = useMemo(() => {
    if (!activeRfq || activeRfq.quotations.length === 0) return null;
    return Math.min(...activeRfq.quotations.map((q) => q.estimatedTotalCents));
  }, [activeRfq]);

  const fastestLead = useMemo(() => {
    if (!activeRfq || activeRfq.quotations.length === 0) return null;
    return Math.min(...activeRfq.quotations.map((q) => q.leadTimeDays));
  }, [activeRfq]);

  async function refreshRfqs(keepSelectedId?: string) {
    const res = await fetch("/api/rfqs");
    if (!res.ok) return;
    const data = await res.json();
    setRfqList(data.rfqs);
    if (keepSelectedId) {
      setSelectedRfqId(keepSelectedId);
    }
  }

  async function handleCreateRfq(e: FormEvent) {
    e.preventDefault();
    setSavingRfq(true);
    try {
      const unitCents = Math.round(Number(targetUnitUsd) * 100);
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rfqTitle,
          targetQty: Number(targetQty),
          targetUnitCents: unitCents,
          currency: "USD",
          dueDate,
          notes: rfqNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to create RFQ.", "error");
        return;
      }
      await refreshRfqs(data.rfq.id);
      setShowNewRfq(false);
      setRfqTitle("");
      setRfqNotes("");
      notify(`Created ${data.rfq.rfqNumber} and opened for supplier bids.`);
    } catch {
      notify("Network error creating RFQ.", "error");
    } finally {
      setSavingRfq(false);
    }
  }

  async function handleCreateQuote(e: FormEvent) {
    e.preventDefault();
    if (!activeRfq) return;
    setSavingQuote(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: activeRfq.id,
          supplierId: quoteSupplierId,
          unitPriceCents: Math.round(Number(quoteUnitUsd) * 100),
          moq: Number(quoteMoq),
          leadTimeDays: Number(quoteLeadDays),
          incoterms: quoteIncoterms,
          freightEstimateCents: Math.round(Number(quoteFreightUsd) * 100),
          notes: quoteNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to submit quotation.", "error");
        return;
      }
      await refreshRfqs(activeRfq.id);
      setShowNewQuote(false);
      setQuoteNotes("");
      notify("Supplier quotation added to comparison matrix.");
    } catch {
      notify("Network error submitting quotation.", "error");
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleAwardQuotation(quoteId: string) {
    setBusyAwardId(quoteId);
    try {
      const res = await fetch(`/api/quotations/${quoteId}/award`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Failed to award quotation.", "error");
        return;
      }
      setLastCreatedPo({
        poNumber: data.purchaseOrder.poNumber,
        supplierName: data.supplierName,
      });
      await refreshRfqs(activeRfq?.id);
      notify(
        `Awarded to ${data.supplierName} & auto-created Purchase Order ${data.purchaseOrder.poNumber}!`,
      );
    } catch {
      notify("Network error awarding quotation.", "error");
    } finally {
      setBusyAwardId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">
            Competitive Bidding &amp; Award Engine
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f1d33]">
            RFQs &amp; Supplier Quotation Comparison
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Compare unit prices, MOQs, lead times, incoterms, and freight estimates side by side —
            then award with 1 click to auto-generate a Purchase Order.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewRfq((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
        >
          {showNewRfq ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showNewRfq ? "Close Form" : "Create RFQ"}</span>
        </button>
      </div>

      {lastCreatedPo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Atomic award completed: <strong>{lastCreatedPo.poNumber}</strong> issued to{" "}
              <strong>{lastCreatedPo.supplierName}</strong>.
            </span>
          </div>
          <Link
            href="/orders"
            className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800"
          >
            View Purchase Order →
          </Link>
        </div>
      ) : null}

      {/* Create RFQ Form */}
      {showNewRfq ? (
        <form
          onSubmit={handleCreateRfq}
          className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-base font-bold text-[#0f1d33]">Issue New Request for Quotation</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Item / Scope Title *</label>
              <input
                required
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                placeholder="e.g., CNC Brass Valve Manifolds (350-bar)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Target Quantity *</label>
              <input
                type="number"
                min={1}
                required
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Target Unit Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                required
                value={targetUnitUsd}
                onChange={(e) => setTargetUnitUsd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Quote Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700">
                Technical Specs &amp; Compliance Notes
              </label>
              <input
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                placeholder="Material cert 3.1, surface finish, packaging standard…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewRfq(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingRfq}
              className="rounded-lg bg-[#0f1d33] px-4 py-2 text-xs font-semibold text-white hover:bg-[#192d4d] disabled:opacity-60"
            >
              {savingRfq ? "Creating…" : "Publish RFQ"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Main Split: RFQ Selector List + Side-by-Side Comparison Matrix */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* RFQ List */}
        <section className="space-y-2.5 xl:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active &amp; Awarded RFQs ({rfqList.length})
          </h2>
          {rfqList.map((rfq) => {
            const active = activeRfq?.id === rfq.id;
            return (
              <button
                key={rfq.id}
                type="button"
                onClick={() => {
                  setSelectedRfqId(rfq.id);
                  setShowNewQuote(false);
                }}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-[#ea580c] bg-white shadow-sm ring-1 ring-orange-500/20"
                    : "border-[#d7dee8] bg-white/80 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[#ea580c]">
                    {rfq.rfqNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      rfq.status === "awarded"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : rfq.status === "evaluating"
                          ? "border-orange-200 bg-orange-50 text-orange-800"
                          : "border-sky-200 bg-sky-50 text-sky-700"
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-[#0f1d33]">{rfq.title}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Target: {rfq.targetQty.toLocaleString()} × {formatUsdCents(rfq.targetUnitCents)}
                  </span>
                  <span className="font-mono font-semibold text-[#0f1d33]">
                    {rfq.quotations.length} bid{rfq.quotations.length === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Quotation Comparison Workspace */}
        <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-8">
          {activeRfq ? (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#0f1d33] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {activeRfq.rfqNumber}
                    </span>
                    <span className="text-xs text-slate-500">Due {activeRfq.dueDate}</span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold text-[#0f1d33]">{activeRfq.title}</h2>
                  <p className="mt-1 text-xs text-slate-600">{activeRfq.notes}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-700">
                    <span>
                      Target Qty:{" "}
                      <strong className="font-mono">{activeRfq.targetQty.toLocaleString()}</strong>
                    </span>
                    <span>
                      Target Unit:{" "}
                      <strong className="font-mono">
                        {formatUsdCents(activeRfq.targetUnitCents)}
                      </strong>
                    </span>
                    <span>
                      Target Budget:{" "}
                      <strong className="font-mono">
                        {formatUsdCents(activeRfq.targetQty * activeRfq.targetUnitCents)}
                      </strong>
                    </span>
                  </div>
                </div>

                {activeRfq.status !== "awarded" ? (
                  <button
                    type="button"
                    onClick={() => setShowNewQuote((prev) => !prev)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0f1d33] bg-[#0f1d33] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1a2f50]"
                  >
                    <Send className="h-3.5 w-3.5 text-[#f97316]" />
                    <span>{showNewQuote ? "Close Bid Form" : "Submit Supplier Quote"}</span>
                  </button>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                    <span>RFQ Awarded</span>
                  </span>
                )}
              </div>

              {/* Submit Supplier Quotation Form */}
              {showNewQuote && activeRfq.status !== "awarded" ? (
                <form
                  onSubmit={handleCreateQuote}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f1d33]">
                    Record Supplier Quotation for {activeRfq.rfqNumber}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Supplier *
                      </label>
                      <select
                        value={quoteSupplierId}
                        onChange={(e) => setQuoteSupplierId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.country})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Unit Price (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        required
                        value={quoteUnitUsd}
                        onChange={(e) => setQuoteUnitUsd(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">MOQ *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quoteMoq}
                        onChange={(e) => setQuoteMoq(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Lead Time (Days) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Incoterms *
                      </label>
                      <select
                        value={quoteIncoterms}
                        onChange={(e) => setQuoteIncoterms(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      >
                        {["EXW", "FCA", "FOB", "CIF", "DAP", "DDP"].map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Freight Estimate (USD)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={0}
                        required
                        value={quoteFreightUsd}
                        onChange={(e) => setQuoteFreightUsd(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Quotation Notes
                      </label>
                      <input
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        placeholder="Validity, tooling amortization, warranty terms…"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewQuote(false)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingQuote}
                      className="rounded-lg bg-[#ea580c] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#c2410c] disabled:opacity-60"
                    >
                      {savingQuote ? "Submitting…" : "Save Quotation"}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Side-by-Side Quotation Comparison Table */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#ea580c]" />
                    <span>Side-by-Side Supplier Quotation Comparison</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Total Est. = max(Target Qty, MOQ) × Unit + Freight
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[660px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="pb-2.5 pr-3 font-semibold">Supplier</th>
                        <th className="pb-2.5 pr-3 font-semibold">Unit Price</th>
                        <th className="pb-2.5 pr-3 font-semibold">MOQ</th>
                        <th className="pb-2.5 pr-3 font-semibold">Lead Time</th>
                        <th className="pb-2.5 pr-3 font-semibold">Incoterms</th>
                        <th className="pb-2.5 pr-3 font-semibold">Freight Est.</th>
                        <th className="pb-2.5 pr-3 font-semibold">Est. Total</th>
                        <th className="pb-2.5 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeRfq.quotations.map((q) => {
                        const isBestPrice = lowestTotal !== null && q.estimatedTotalCents === lowestTotal;
                        const isFastest = fastestLead !== null && q.leadTimeDays === fastestLead;
                        return (
                          <tr
                            key={q.id}
                            className={
                              q.selected
                                ? "bg-emerald-50/70"
                                : isBestPrice
                                  ? "bg-orange-50/40"
                                  : "hover:bg-slate-50"
                            }
                          >
                            <td className="py-3 pr-3">
                              <p className="font-semibold text-[#0f1d33]">{q.supplierName}</p>
                              <p className="text-[11px] text-slate-500">
                                {q.supplierCountry} · OTD {formatPct(q.supplierOnTimePct)}
                              </p>
                              {q.notes ? (
                                <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-500">
                                  {q.notes}
                                </p>
                              ) : null}
                            </td>
                            <td className="py-3 pr-3 font-mono font-semibold text-[#0f1d33]">
                              {formatUsdCents(q.unitPriceCents)}
                            </td>
                            <td className="py-3 pr-3 font-mono text-slate-700">
                              {q.moq.toLocaleString()}
                            </td>
                            <td className="py-3 pr-3">
                              <span className="font-mono text-slate-800">{q.leadTimeDays}d</span>
                              {isFastest ? (
                                <span className="ml-1.5 inline-flex rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                                  Fastest
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 pr-3">
                              <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#0f1d33]">
                                {q.incoterms}
                              </span>
                            </td>
                            <td className="py-3 pr-3 font-mono text-slate-700">
                              {formatUsdCents(q.freightEstimateCents)}
                            </td>
                            <td className="py-3 pr-3">
                              <p className="font-mono font-bold text-[#0f1d33]">
                                {formatUsdCents(q.estimatedTotalCents)}
                              </p>
                              {isBestPrice ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#ea580c]">
                                  <Sparkles className="h-3 w-3" /> Lowest Est.
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 text-right">
                              {q.selected ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                                  <Award className="h-3.5 w-3.5" />
                                  Awarded
                                </span>
                              ) : activeRfq.status !== "awarded" ? (
                                <button
                                  type="button"
                                  disabled={busyAwardId !== null}
                                  onClick={() => handleAwardQuotation(q.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#ea580c] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#c2410c] disabled:opacity-50"
                                >
                                  <span>
                                    {busyAwardId === q.id ? "Awarding…" : "Award & Create PO"}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">Not selected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {activeRfq.quotations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            No supplier quotations submitted yet. Click &ldquo;Submit Supplier
                            Quote&rdquo; above to add bids for side-by-side comparison.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Create an RFQ to start collecting supplier bids.</p>
          )}
        </section>
      </div>
    </div>
  );
}
