"use client";

import { useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { calculateProfitMargin, type ProfitMarginInput } from "@/lib/tools/business-calculators";

const INITIAL: ProfitMarginInput = {
  currency: "USD",
  sellingPrice: 89,
  unitCogs: 26,
  shippingPerUnit: 7.5,
  paymentFeePct: 2.9,
  marketplaceFeePct: 8,
  marketingPerUnit: 14,
  monthlyFixedCosts: 4500,
  monthlyUnitsSold: 250,
};

const fmt = (n: number, c: string) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ProfitMarginCalculator() {
  const [input, setInput] = useState<ProfitMarginInput>(INITIAL);
  const r = calculateProfitMargin(input);

  const setNum = (k: keyof ProfitMarginInput, raw: string) => {
    const val = raw === "" ? 0 : Number(raw);
    setInput((p) => ({ ...p, [k]: Number.isFinite(val) ? Math.max(0, val) : 0 }));
  };

  const summaryText = [
    `Unit Economics & Profit Margin (${input.currency})`,
    `Selling Price: ${fmt(input.sellingPrice, input.currency)} | COGS: ${fmt(input.unitCogs, input.currency)}`,
    `Gross Profit: ${fmt(r.grossProfitPerUnit, input.currency)} (${r.grossMarginPct}% gross margin · ${r.markupPct}% markup)`,
    `Contribution Margin / Unit: ${fmt(r.contributionMarginPerUnit, input.currency)} (${r.contributionMarginPct}%)`,
    `Break-Even Monthly Volume: ${r.breakEvenUnits !== null ? `${r.breakEvenUnits} units` : "Unprofitable unit economics"}`,
    `Projected Monthly Net Profit (${input.monthlyUnitsSold} units): ${fmt(r.monthlyNetProfit, input.currency)} (${r.netMarginPct}% net margin)`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <label className="calc__field">
            <span>Currency</span>
            <select value={input.currency} onChange={(e) => setInput((p) => ({ ...p, currency: e.target.value }))}>
              {["USD", "EUR", "GBP", "AED", "PKR"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="calc__field">
            <span>Selling price per unit</span>
            <input type="number" min={0} step={0.01} value={input.sellingPrice} onChange={(e) => setNum("sellingPrice", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Unit COGS / landed cost</span>
            <input type="number" min={0} step={0.01} value={input.unitCogs} onChange={(e) => setNum("unitCogs", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Fulfilment &amp; shipping / unit</span>
            <input type="number" min={0} step={0.01} value={input.shippingPerUnit} onChange={(e) => setNum("shippingPerUnit", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Payment processing fee (%)</span>
            <input type="number" min={0} max={50} step={0.1} value={input.paymentFeePct} onChange={(e) => setNum("paymentFeePct", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Platform / marketplace fee (%)</span>
            <input type="number" min={0} max={50} step={0.1} value={input.marketplaceFeePct} onChange={(e) => setNum("marketplaceFeePct", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Marketing / ad cost per unit</span>
            <input type="number" min={0} step={0.01} value={input.marketingPerUnit} onChange={(e) => setNum("marketingPerUnit", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Monthly fixed overhead</span>
            <input type="number" min={0} value={input.monthlyFixedCosts} onChange={(e) => setNum("monthlyFixedCosts", e.target.value)} />
          </label>
        </div>

        <label className="calc__field">
          <span>Expected monthly units sold</span>
          <input type="number" min={0} value={input.monthlyUnitsSold} onChange={(e) => setNum("monthlyUnitsSold", e.target.value)} />
        </label>
      </div>

      <div className="calc__output panel">
        <p className="eyebrow eyebrow--plain">Margin &amp; Break-Even Summary</p>
        <div className="calc__headline">{r.grossMarginPct}% Gross Margin</div>
        <p className="fine-print">
          Markup: <strong>{r.markupPct}%</strong> · Break-even:{" "}
          <strong>{r.breakEvenUnits !== null ? `${r.breakEvenUnits} units/mo` : "N/A (negative contribution)"}</strong>
        </p>

        <dl className="calc__breakdown">
          <div><dt>Gross Profit / Unit</dt><dd>{fmt(r.grossProfitPerUnit, input.currency)}</dd></div>
          <div><dt>Variable Cost / Unit</dt><dd>{fmt(r.variableCostsPerUnit, input.currency)}</dd></div>
          <div><dt>Contribution Margin / Unit</dt><dd><strong>{fmt(r.contributionMarginPerUnit, input.currency)} ({r.contributionMarginPct}%)</strong></dd></div>
          <div><dt>Monthly Revenue</dt><dd>{fmt(r.monthlyRevenue, input.currency)}</dd></div>
          <div><dt>Monthly Net Operating Profit</dt><dd><strong>{fmt(r.monthlyNetProfit, input.currency)} ({r.netMarginPct}%)</strong></dd></div>
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />
      </div>
    </div>
  );
}
