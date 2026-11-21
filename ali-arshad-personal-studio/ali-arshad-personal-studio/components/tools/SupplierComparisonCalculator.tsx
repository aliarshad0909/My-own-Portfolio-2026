"use client";

import { useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import {
  calculateSupplierComparison,
  type SupplierComparisonInput,
  type SupplierOptionInput,
} from "@/lib/tools/business-calculators";

const INITIAL: SupplierComparisonInput = {
  currency: "USD",
  orderQuantity: 1000,
  costWeight: 50,
  qualityWeight: 30,
  speedWeight: 20,
  suppliers: [
    { id: "s1", name: "Shenzhen Precision Co.", unitPrice: 11.4, freightTotal: 1450, moq: 500, leadTimeDays: 28, defectRatePct: 2.2, onTimePct: 94 },
    { id: "s2", name: "Ho Chi Minh Industrial", unitPrice: 12.1, freightTotal: 1200, moq: 500, leadTimeDays: 24, defectRatePct: 1.5, onTimePct: 97 },
    { id: "s3", name: "Monterrey Nearshore Mfg", unitPrice: 14.5, freightTotal: 650, moq: 250, leadTimeDays: 11, defectRatePct: 0.9, onTimePct: 98 },
  ],
};

const fmt = (n: number, c: string) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SupplierComparisonCalculator() {
  const [input, setInput] = useState<SupplierComparisonInput>(INITIAL);
  const r = calculateSupplierComparison(input);
  const winner = r.rows.find((row) => row.id === r.recommendedId);

  const updateSupplier = (idx: number, field: keyof SupplierOptionInput, raw: string) => {
    setInput((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s, i) =>
        i !== idx
          ? s
          : {
              ...s,
              [field]: field === "name" ? raw : Number.isFinite(Number(raw)) ? Math.max(0, Number(raw)) : 0,
            },
      ),
    }));
  };

  const summaryText = [
    `Supplier Comparison Matrix (Order Qty: ${input.orderQuantity} · ${input.currency})`,
    `Weights: Cost ${input.costWeight}% / Quality ${input.qualityWeight}% / Speed ${input.speedWeight}%`,
    ...r.rows.map(
      (row) =>
        `- ${row.name}: Score ${row.weightedScore}/100 | Effective Cost/Good Unit: ${fmt(row.effectiveCostPerGoodUnit, input.currency)} | Total: ${fmt(row.totalOrderCost, input.currency)}`,
    ),
    `Recommended Supplier: ${winner?.name ?? "N/A"} (Spread vs highest bid: ${fmt(r.savingsVsHighest, input.currency)})`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <label className="calc__field">
            <span>Order quantity (units)</span>
            <input
              type="number"
              min={1}
              value={input.orderQuantity}
              onChange={(e) => setInput((p) => ({ ...p, orderQuantity: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </label>
          <label className="calc__field">
            <span>Currency</span>
            <select value={input.currency} onChange={(e) => setInput((p) => ({ ...p, currency: e.target.value }))}>
              {["USD", "EUR", "GBP", "AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Cost weight (%)</span>
            <input type="number" min={0} max={100} value={input.costWeight} onChange={(e) => setInput((p) => ({ ...p, costWeight: Number(e.target.value) || 0 }))} />
          </label>
          <label className="calc__field">
            <span>Quality weight (%)</span>
            <input type="number" min={0} max={100} value={input.qualityWeight} onChange={(e) => setInput((p) => ({ ...p, qualityWeight: Number(e.target.value) || 0 }))} />
          </label>
          <label className="calc__field">
            <span>Speed weight (%)</span>
            <input type="number" min={0} max={100} value={input.speedWeight} onChange={(e) => setInput((p) => ({ ...p, speedWeight: Number(e.target.value) || 0 }))} />
          </label>
        </div>

        {input.suppliers.map((sup, idx) => (
          <fieldset key={sup.id} className="calc__field" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px" }}>
            <legend>Supplier {idx + 1}</legend>
            <div className="calc__row">
              <label className="calc__field">
                <span>Name</span>
                <input value={sup.name} onChange={(e) => updateSupplier(idx, "name", e.target.value)} />
              </label>
              <label className="calc__field">
                <span>Unit price</span>
                <input type="number" step={0.01} value={sup.unitPrice} onChange={(e) => updateSupplier(idx, "unitPrice", e.target.value)} />
              </label>
              <label className="calc__field">
                <span>Total freight</span>
                <input type="number" step={1} value={sup.freightTotal} onChange={(e) => updateSupplier(idx, "freightTotal", e.target.value)} />
              </label>
            </div>
            <div className="calc__row">
              <label className="calc__field">
                <span>Lead time (days)</span>
                <input type="number" min={1} value={sup.leadTimeDays} onChange={(e) => updateSupplier(idx, "leadTimeDays", e.target.value)} />
              </label>
              <label className="calc__field">
                <span>Defect rate (%)</span>
                <input type="number" step={0.1} value={sup.defectRatePct} onChange={(e) => updateSupplier(idx, "defectRatePct", e.target.value)} />
              </label>
              <label className="calc__field">
                <span>On-time (%)</span>
                <input type="number" max={100} value={sup.onTimePct} onChange={(e) => updateSupplier(idx, "onTimePct", e.target.value)} />
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="calc__output panel">
        <p className="eyebrow eyebrow--plain">Weighted Supplier Ranking</p>
        <div className="calc__headline">{winner?.name ?? "—"}</div>
        <p className="fine-print">
          Top weighted score: <strong>{winner?.weightedScore ?? 0} / 100</strong> · Cost spread vs highest quote:{" "}
          <strong>{fmt(r.savingsVsHighest, input.currency)}</strong>
        </p>

        <dl className="calc__breakdown">
          {r.rows.map((row) => (
            <div key={row.id}>
              <dt>
                {row.name} {row.id === r.recommendedId ? "(Recommended)" : ""}
              </dt>
              <dd>
                <strong>{row.weightedScore}/100</strong> · {fmt(row.effectiveCostPerGoodUnit, input.currency)}/good unit
              </dd>
            </div>
          ))}
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />
      </div>
    </div>
  );
}
