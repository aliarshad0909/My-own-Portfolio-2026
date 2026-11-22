"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BookmarkCheck,
  Calculator,
  FolderOpen,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatCurrencyCents, formatPct, formatUsdCents } from "@/lib/format";
import { CURRENCY_DEFAULTS, calculateLandedCost } from "@/lib/landed-cost";
import { getLandedCostSnapshotKey } from "@/lib/workspace-sync";

type ScenarioRow = {
  id: string;
  title: string;
  productPriceCents: number;
  quantity: number;
  freightCents: number;
  insuranceCents: number;
  customsDutyPct: number;
  otherExpensesCents: number;
  currency: string;
  exchangeRateToUsd: number;
  totalLandedUsdCents: number;
  perUnitLandedUsdCents: number;
  notes: string;
};

export function LandedCostClient({
  initialScenarios,
}: {
  initialScenarios: ScenarioRow[];
}) {
  const snapshotKey = getLandedCostSnapshotKey(initialScenarios);
  return <LandedCostWorkspace key={snapshotKey} initialScenarios={initialScenarios} />;
}

function LandedCostWorkspace({
  initialScenarios,
}: {
  initialScenarios: ScenarioRow[];
}) {
  const { notify } = useToast();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>(initialScenarios);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculator inputs (in major currency units for crisp UX)
  const [title, setTitle] = useState("Q1 2027 Vietnam Power Module Import (Ocean 20ft)");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRateToUsd, setExchangeRateToUsd] = useState("1.0000");
  const [productPrice, setProductPrice] = useState("64.50");
  const [quantity, setQuantity] = useState("800");
  const [freight, setFreight] = useState("3400.00");
  const [insurance, setInsurance] = useState("485.00");
  const [customsDutyPct, setCustomsDutyPct] = useState("7.5");
  const [otherExpenses, setOtherExpenses] = useState("1250.00");
  const [notes, setNotes] = useState(
    "Includes estimated customs brokerage, port drayage, and ISF filing fees.",
  );

  const breakdown = useMemo(() => {
    return calculateLandedCost({
      productPriceCents: Math.round((Number(productPrice) || 0) * 100),
      quantity: Math.max(1, Math.round(Number(quantity) || 1)),
      freightCents: Math.round((Number(freight) || 0) * 100),
      insuranceCents: Math.round((Number(insurance) || 0) * 100),
      customsDutyPct: Math.max(0, Number(customsDutyPct) || 0),
      otherExpensesCents: Math.round((Number(otherExpenses) || 0) * 100),
      currency,
      exchangeRateToUsd: Math.max(0.0001, Number(exchangeRateToUsd) || 1),
    });
  }, [
    productPrice,
    quantity,
    freight,
    insurance,
    customsDutyPct,
    otherExpenses,
    currency,
    exchangeRateToUsd,
  ]);

  function handleCurrencyChange(nextCurrency: string) {
    setCurrency(nextCurrency);
    const preset = CURRENCY_DEFAULTS[nextCurrency];
    if (preset) {
      setExchangeRateToUsd(preset.defaultRateToUsd.toString());
    }
  }

  function loadScenario(s: ScenarioRow) {
    setTitle(s.title);
    setCurrency(s.currency);
    setExchangeRateToUsd(String(s.exchangeRateToUsd));
    setProductPrice((s.productPriceCents / 100).toFixed(2));
    setQuantity(String(s.quantity));
    setFreight((s.freightCents / 100).toFixed(2));
    setInsurance((s.insuranceCents / 100).toFixed(2));
    setCustomsDutyPct(String(s.customsDutyPct));
    setOtherExpenses((s.otherExpensesCents / 100).toFixed(2));
    setNotes(s.notes);
    notify(`Loaded scenario "${s.title}" into calculator.`, "info");
  }

  function resetInputs() {
    setTitle("New Import Scenario");
    setCurrency("USD");
    setExchangeRateToUsd("1.0000");
    setProductPrice("50.00");
    setQuantity("500");
    setFreight("2800.00");
    setInsurance("350.00");
    setCustomsDutyPct("5.0");
    setOtherExpenses("950.00");
    setNotes("");
  }

  async function handleSaveScenario(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/landed-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          productPriceCents: Math.round((Number(productPrice) || 0) * 100),
          quantity: Math.max(1, Math.round(Number(quantity) || 1)),
          freightCents: Math.round((Number(freight) || 0) * 100),
          insuranceCents: Math.round((Number(insurance) || 0) * 100),
          customsDutyPct: Math.max(0, Number(customsDutyPct) || 0),
          otherExpensesCents: Math.round((Number(otherExpenses) || 0) * 100),
          currency,
          exchangeRateToUsd: Math.max(0.0001, Number(exchangeRateToUsd) || 1),
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to save landed-cost scenario.", "error");
        return;
      }
      setScenarios((prev) => [data.scenario, ...prev]);
      notify(`Saved landed-cost scenario "${data.scenario.title}" to PostgreSQL.`);
    } catch {
      notify("Network error saving landed-cost scenario.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteScenario(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/landed-cost/${id}`, { method: "DELETE" });
      if (!res.ok) {
        notify("Could not delete scenario.", "error");
        return;
      }
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      notify("Removed landed-cost scenario.");
    } finally {
      setDeletingId(null);
    }
  }

  const showDualCurrency = breakdown.currency !== "USD";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">
            Total Cost of Ownership &amp; Import Modeling
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f1d33]">
            Landed-Cost Calculator &amp; Scenarios
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Model FOB, CIF, customs duty, freight, insurance, ancillary import fees, and FX
            conversion — and persist scenarios for sourcing committee review.
          </p>
        </div>
        <button
          type="button"
          onClick={resetInputs}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#0f1d33] hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#ea580c]" />
          <span>Reset Calculator</span>
        </button>
      </div>

      {/* Mandatory Compliance / Assumptions Notice */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3.5 text-xs text-amber-950 shadow-xs"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ea580c]" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-[#0f1d33]">
            Planning Estimate Notice — User-Entered Assumptions vs. Verified Tariffs
          </p>
          <p>
            All landed-cost figures below are calculated strictly from{" "}
            <strong>user-entered planning assumptions</strong> (unit price, freight, insurance,
            estimated duty %, FX rate, and handling fees). They do{" "}
            <strong>not</strong> represent binding customs broker HTS tariff rulings, verified
            freight carrier quotes, anti-dumping/countervailing duties, or live FX settlement rates.
            Always confirm final duty schedules and shipping tariffs with a licensed customs broker
            and freight forwarder prior to PO execution.
          </p>
        </div>
      </div>

      {/* Main Split: Calculator Form + Live Itemized Breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Input Form */}
        <form
          onSubmit={handleSaveScenario}
          className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0f1d33]">
              <Calculator className="h-4 w-4 text-[#ea580c]" />
              <span>User-Entered Cost Assumptions</span>
            </h2>
            <span className="font-mono text-[11px] font-semibold text-slate-500">
              {breakdown.currency} → USD
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Scenario Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Source Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {Object.entries(CURRENCY_DEFAULTS).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Exchange Rate (1 {currency} → USD)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min={0.0001}
                  required
                  value={exchangeRateToUsd}
                  onChange={(e) => setExchangeRateToUsd(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Product Unit Price ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Order Quantity (Units) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  International Freight ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Cargo Insurance ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Estimated Customs Duty (% of CIF)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={200}
                  required
                  value={customsDutyPct}
                  onChange={(e) => setCustomsDutyPct(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Other Expenses — Broker/Drayage ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[#ea580c] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Assumptions &amp; Tariff Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#ea580c] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving to PostgreSQL…" : "Save Scenario to Workspace"}</span>
            </button>
          </div>
        </form>

        {/* Live Itemized Breakdown */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#d7dee8] bg-[#0f1d33] p-5 text-white shadow-sm xl:col-span-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">
                  Live Calculation Output
                </p>
                <h2 className="text-lg font-bold text-white">Itemized Landed-Cost Breakdown</h2>
              </div>
              <span className="rounded-md bg-[#192d4d] px-2.5 py-1 font-mono text-xs text-orange-200">
                +{formatPct(breakdown.overheadPctOverFob)} over FOB
              </span>
            </div>

            {/* Hero Totals */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-[#162744] p-4">
                <p className="text-xs text-slate-300">Total Landed Cost (USD)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {formatUsdCents(breakdown.totalLandedUsdCents)}
                </p>
                {showDualCurrency ? (
                  <p className="mt-0.5 font-mono text-xs text-orange-300">
                    {formatCurrencyCents(breakdown.totalLandedSourceCents, breakdown.currency)}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-orange-500/40 bg-[#1c2f4f] p-4">
                <p className="text-xs text-orange-200">Per-Unit Landed Cost (USD)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#f97316]">
                  {formatUsdCents(breakdown.perUnitLandedUsdCents)}
                </p>
                {showDualCurrency ? (
                  <p className="mt-0.5 font-mono text-xs text-slate-300">
                    {formatCurrencyCents(breakdown.perUnitLandedSourceCents, breakdown.currency)} /
                    unit
                  </p>
                ) : (
                  <p className="mt-0.5 font-mono text-xs text-slate-300">
                    Across {breakdown.quantity.toLocaleString()} units
                  </p>
                )}
              </div>
            </div>

            {/* Stacked Cost Share Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Cost Structure Composition</span>
                <span className="font-mono">
                  Product {breakdown.costSharesPct.product}% · Logistics/Duty{" "}
                  {(100 - breakdown.costSharesPct.product).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  style={{ width: `${breakdown.costSharesPct.product}%` }}
                  className="bg-sky-400"
                  title="FOB Product Value"
                />
                <div
                  style={{ width: `${breakdown.costSharesPct.freight}%` }}
                  className="bg-[#f97316]"
                  title="Freight"
                />
                <div
                  style={{ width: `${breakdown.costSharesPct.insurance}%` }}
                  className="bg-amber-300"
                  title="Insurance"
                />
                <div
                  style={{ width: `${breakdown.costSharesPct.duty}%` }}
                  className="bg-rose-400"
                  title="Customs Duty"
                />
                <div
                  style={{ width: `${breakdown.costSharesPct.other}%` }}
                  className="bg-emerald-400"
                  title="Other Expenses"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-400" /> FOB ({breakdown.costSharesPct.product}%)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Freight ({breakdown.costSharesPct.freight}%)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-300" /> Insurance ({breakdown.costSharesPct.insurance}%)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> Duty ({breakdown.costSharesPct.duty}%)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Other ({breakdown.costSharesPct.other}%)
                </span>
              </div>
            </div>

            {/* Itemized Ledger Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="pb-2 text-left font-semibold">Cost Component</th>
                    {showDualCurrency ? (
                      <th className="pb-2 text-right font-semibold">{breakdown.currency}</th>
                    ) : null}
                    <th className="pb-2 text-right font-semibold">USD Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2 font-sans text-slate-200">
                      FOB Merchandise Value ({breakdown.quantity.toLocaleString()} units)
                    </td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-slate-300">
                        {formatCurrencyCents(breakdown.fobSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 text-right text-white">
                      {formatUsdCents(breakdown.fobUsdCents)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-200">International Freight</td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-slate-300">
                        {formatCurrencyCents(breakdown.freightSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 text-right text-white">
                      {formatUsdCents(breakdown.freightUsdCents)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-200">Cargo Insurance</td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-slate-300">
                        {formatCurrencyCents(breakdown.insuranceSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 text-right text-white">
                      {formatUsdCents(breakdown.insuranceUsdCents)}
                    </td>
                  </tr>
                  <tr className="bg-[#162744]/80 font-semibold">
                    <td className="py-2 pl-2 font-sans text-orange-200">
                      CIF Value (FOB + Freight + Insurance)
                    </td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-orange-200">
                        {formatCurrencyCents(breakdown.cifSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 pr-2 text-right text-orange-200">
                      {formatUsdCents(breakdown.cifUsdCents)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-200">
                      Estimated Customs Duty ({breakdown.customsDutyPct}% × CIF)
                    </td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-slate-300">
                        {formatCurrencyCents(breakdown.dutySourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 text-right text-white">
                      {formatUsdCents(breakdown.dutyUsdCents)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-200">
                      Other Expenses (Brokerage, Drayage, Handling)
                    </td>
                    {showDualCurrency ? (
                      <td className="py-2 text-right text-slate-300">
                        {formatCurrencyCents(breakdown.otherExpensesSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="py-2 text-right text-white">
                      {formatUsdCents(breakdown.otherExpensesUsdCents)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-[#ea580c] text-sm font-bold">
                    <td className="pt-3 font-sans text-white">Total Estimated Landed Cost</td>
                    {showDualCurrency ? (
                      <td className="pt-3 text-right text-orange-300">
                        {formatCurrencyCents(breakdown.totalLandedSourceCents, breakdown.currency)}
                      </td>
                    ) : null}
                    <td className="pt-3 text-right text-[#f97316]">
                      {formatUsdCents(breakdown.totalLandedUsdCents)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-5 border-t border-slate-700 pt-3 text-[11px] text-slate-400">
            Formula: CIF = (Unit Price × Qty) + Freight + Insurance · Duty = CIF × Duty % · Landed =
            (CIF + Duty + Other Expenses) × FX Rate.
          </p>
        </section>
      </div>

      {/* Saved Scenarios Table */}
      <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-4 w-4 text-[#ea580c]" />
            <h2 className="text-base font-bold text-[#0f1d33]">
              Saved Landed-Cost Scenarios ({scenarios.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Persisted in PostgreSQL</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 pr-3 font-semibold">Scenario</th>
                <th className="pb-2.5 pr-3 font-semibold">Qty × Unit</th>
                <th className="pb-2.5 pr-3 font-semibold">Duty % / FX</th>
                <th className="pb-2.5 pr-3 font-semibold">Total Landed (USD)</th>
                <th className="pb-2.5 pr-3 font-semibold">Per-Unit (USD)</th>
                <th className="pb-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-[#0f1d33]">{s.title}</p>
                    {s.notes ? (
                      <p className="max-w-md truncate text-[11px] text-slate-500">{s.notes}</p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-700">
                    {s.quantity.toLocaleString()} ×{" "}
                    {formatCurrencyCents(s.productPriceCents, s.currency)}
                  </td>
                  <td className="py-3 pr-3 font-mono text-slate-700">
                    {s.customsDutyPct}% · {s.currency} @{s.exchangeRateToUsd}
                  </td>
                  <td className="py-3 pr-3 font-mono font-bold text-[#0f1d33]">
                    {formatUsdCents(s.totalLandedUsdCents)}
                  </td>
                  <td className="py-3 pr-3 font-mono font-bold text-[#ea580c]">
                    {formatUsdCents(s.perUnitLandedUsdCents)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => loadScenario(s)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0f1d33] hover:border-orange-300 hover:text-[#ea580c]"
                      >
                        <FolderOpen className="h-3 w-3" />
                        <span>Load</span>
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === s.id}
                        onClick={() => handleDeleteScenario(s.id)}
                        aria-label={`Delete ${s.title}`}
                        className="inline-flex items-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scenarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No landed-cost scenarios saved yet. Configure assumptions above and save.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
