"use client";

import { useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { calculateInventoryReorder, type InventoryReorderInput } from "@/lib/tools/business-calculators";

const INITIAL: InventoryReorderInput = {
  currency: "USD",
  avgDailySales: 14,
  leadTimeDays: 18,
  safetyDays: 7,
  currentOnHand: 220,
  inboundPoUnits: 60,
  unitCost: 24.5,
  orderingCostPerPo: 120,
  annualHoldingRatePct: 22,
};

const fmt = (n: number, c: string) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function InventoryReorderCalculator() {
  const [input, setInput] = useState<InventoryReorderInput>(INITIAL);
  const r = calculateInventoryReorder(input);

  const setNum = (k: keyof InventoryReorderInput, raw: string) => {
    const val = raw === "" ? 0 : Number(raw);
    setInput((p) => ({ ...p, [k]: Number.isFinite(val) ? Math.max(0, val) : 0 }));
  };

  const summaryText = [
    `Inventory Reorder & EOQ Plan (${input.currency})`,
    `Reorder Point (ROP): ${r.reorderPoint} units (Lead-Time Demand ${r.leadTimeDemand} + Safety Stock ${r.safetyStock})`,
    `Effective Inventory Position: ${r.effectiveInventoryPosition} units (${r.daysOfCover} days of cover)`,
    `Status: ${r.shouldReorderNow ? "REORDER NOW" : "Above reorder threshold"}`,
    `Economic Order Quantity (EOQ): ${r.eoq} units`,
    `Recommended PO Quantity: ${r.recommendedOrderQty} units (${fmt(r.estimatedOrderValue, input.currency)})`,
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
            <span>Average daily unit sales</span>
            <input type="number" min={0} step={0.5} value={input.avgDailySales} onChange={(e) => setNum("avgDailySales", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Supplier lead time (days)</span>
            <input type="number" min={0} value={input.leadTimeDays} onChange={(e) => setNum("leadTimeDays", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Safety stock buffer (days)</span>
            <input type="number" min={0} value={input.safetyDays} onChange={(e) => setNum("safetyDays", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Current on-hand stock</span>
            <input type="number" min={0} value={input.currentOnHand} onChange={(e) => setNum("currentOnHand", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Open inbound PO units</span>
            <input type="number" min={0} value={input.inboundPoUnits} onChange={(e) => setNum("inboundPoUnits", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Landed unit cost ({input.currency})</span>
            <input type="number" min={0} step={0.01} value={input.unitCost} onChange={(e) => setNum("unitCost", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Fixed ordering cost per PO</span>
            <input type="number" min={0} value={input.orderingCostPerPo} onChange={(e) => setNum("orderingCostPerPo", e.target.value)} />
          </label>
        </div>

        <label className="calc__field">
          <span>Annual inventory holding cost (%)</span>
          <input type="number" min={1} max={100} value={input.annualHoldingRatePct} onChange={(e) => setNum("annualHoldingRatePct", e.target.value)} />
        </label>
      </div>

      <div className="calc__output panel">
        <p className="eyebrow eyebrow--plain">Reorder Trigger &amp; EOQ</p>
        <div className="calc__headline">{r.reorderPoint} units ROP</div>
        <p className="fine-print">
          Status: <strong>{r.shouldReorderNow ? "Reorder Now (at or below ROP)" : "Healthy Stock Cover"}</strong> ·{" "}
          {r.daysOfCover} days of cover remaining
        </p>

        <dl className="calc__breakdown">
          <div><dt>Lead-Time Demand</dt><dd>{r.leadTimeDemand} units</dd></div>
          <div><dt>Safety Stock Buffer</dt><dd>{r.safetyStock} units</dd></div>
          <div><dt>Current + Inbound Position</dt><dd>{r.effectiveInventoryPosition} units</dd></div>
          <div><dt>Economic Order Qty (EOQ)</dt><dd>{r.eoq} units</dd></div>
          <div><dt>Recommended PO Qty</dt><dd><strong>{r.recommendedOrderQty} units</strong></dd></div>
          <div><dt>Estimated PO Capital</dt><dd><strong>{fmt(r.estimatedOrderValue, input.currency)}</strong></dd></div>
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />
      </div>
    </div>
  );
}
