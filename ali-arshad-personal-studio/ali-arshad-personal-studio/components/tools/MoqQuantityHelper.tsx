"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import { calculateMoqPlan, type MoqInput } from "@/lib/tools/moq";

const INITIAL: MoqInput = {
  unitPriceUsd: 12.5,
  supplierMoqUnits: 100,
  plannedUnits: 120,
  unitsPerCarton: 12,
  cartonLengthCm: 54,
  cartonWidthCm: 42,
  cartonHeightCm: 38,
  cartonWeightKg: 14,
  setupFeeUsd: 150,
  budgetCapUsd: 2500,
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function MoqQuantityHelper() {
  const [input, setInput] = useState<MoqInput>(INITIAL);
  const r = calculateMoqPlan(input);

  const setNum = (key: keyof MoqInput, raw: string) => {
    const n = raw === "" ? 0 : Number(raw);
    setInput((prev) => ({ ...prev, [key]: Number.isFinite(n) ? Math.max(n, 0) : 0 }));
  };

  const summaryText = [
    `MOQ & Order Quantity Plan (Estimate Only)`,
    `Supplier MOQ: ${input.supplierMoqUnits} units | Planned: ${input.plannedUnits} units (${r.roundedOrderUnits} units across ${r.cartonsNeeded} cartons @ ${input.unitsPerCarton} pcs/ctn)`,
    `MOQ check: ${r.meetsMoq ? "Meets supplier MOQ" : `Short by ${r.shortfallUnits} units`}`,
    `Goods subtotal: ${usd(r.totalGoodsUsd)} + Setup/packaging: ${usd(r.setupFeeUsd)} = ${usd(r.totalOrderOutlayUsd)} (${usd(r.effectiveUnitCostUsd)}/unit effective EXW/FOB)`,
    `Total shipment volume: ${r.totalCbm} CBM (${r.fill20ftPct}% of 20ft container) | Total gross weight: ${r.totalGrossWeightKg} kg`,
    `Note: Planning estimate only — excludes international freight, duties, and taxes. Confirm exact carton specs with the supplier.`,
  ].join("\n");

  const sourcingContactHref = `/contact?service=${encodeURIComponent("Global Sourcing & Supply Chain")}&summary=${encodeURIComponent(summaryText)}`;

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <label className="calc__field">
            <span>
              Supplier unit price <span className="calc__suffix">(USD)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={0.1} value={input.unitPriceUsd} onChange={(e) => setNum("unitPriceUsd", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Units per export carton <span className="calc__suffix">(pcs/ctn)</span>
            </span>
            <input type="number" inputMode="numeric" min={1} step={1} value={input.unitsPerCarton} onChange={(e) => setNum("unitsPerCarton", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>
              Supplier MOQ <span className="calc__suffix">(units)</span>
            </span>
            <input type="number" inputMode="numeric" min={1} step={5} value={input.supplierMoqUnits} onChange={(e) => setNum("supplierMoqUnits", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Your planned quantity <span className="calc__suffix">(units)</span>
            </span>
            <input type="number" inputMode="numeric" min={1} step={5} value={input.plannedUnits} onChange={(e) => setNum("plannedUnits", e.target.value)} />
          </label>
        </div>

        <div className="calc__row calc__row--3">
          <label className="calc__field">
            <span>
              Carton L <span className="calc__suffix">(cm)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={1} value={input.cartonLengthCm} onChange={(e) => setNum("cartonLengthCm", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Carton W <span className="calc__suffix">(cm)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={1} value={input.cartonWidthCm} onChange={(e) => setNum("cartonWidthCm", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Carton H <span className="calc__suffix">(cm)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={1} value={input.cartonHeightCm} onChange={(e) => setNum("cartonHeightCm", e.target.value)} />
          </label>
        </div>

        <div className="calc__row calc__row--3">
          <label className="calc__field">
            <span>
              Carton gross wt <span className="calc__suffix">(kg)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={0.5} value={input.cartonWeightKg} onChange={(e) => setNum("cartonWeightKg", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Packaging / tooling <span className="calc__suffix">(USD)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={25} value={input.setupFeeUsd ?? 0} onChange={(e) => setNum("setupFeeUsd", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>
              Target goods budget <span className="calc__suffix">(USD)</span>
            </span>
            <input type="number" inputMode="decimal" min={0} step={100} value={input.budgetCapUsd ?? 0} onChange={(e) => setNum("budgetCapUsd", e.target.value)} />
          </label>
        </div>
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Estimated order outlay (full cartons)</p>
        <p className="calc__out-value">{usd(r.totalOrderOutlayUsd)}</p>
        <p className="calc__out-pill">
          <strong>{r.cartonsNeeded} cartons</strong> ({r.roundedOrderUnits.toLocaleString("en-US")} units) ·{" "}
          {r.meetsMoq ? "Meets supplier MOQ" : `Short of MOQ by ${r.shortfallUnits} units`}
        </p>

        <dl className="calc__breakdown">
          <div>
            <dt>Effective unit cost (incl. setup)</dt>
            <dd>{usd(r.effectiveUnitCostUsd)} / unit</dd>
          </div>
          <div>
            <dt>Total volume (CBM)</dt>
            <dd>
              {r.totalCbm} CBM ({r.cbmPerCarton} CBM/ctn)
            </dd>
          </div>
          <div>
            <dt>Total gross weight</dt>
            <dd>{r.totalGrossWeightKg} kg</dd>
          </div>
          <div>
            <dt>Air courier vol. weight (÷5000)</dt>
            <dd>{r.volumetricWeightKg5000} kg</dd>
          </div>
          <div>
            <dt>Container fill indicator</dt>
            <dd>
              {r.fill20ftPct}% of 20ft · {r.fill40ftPct}% of 40ft
            </dd>
          </div>
          {r.withinBudget !== null && r.budgetRemainingUsd !== null ? (
            <div>
              <dt>Budget check</dt>
              <dd>{r.withinBudget ? `Within cap (${usd(r.budgetRemainingUsd)} buffer)` : `Over cap by ${usd(Math.abs(r.budgetRemainingUsd))}`}</dd>
            </div>
          ) : null}
        </dl>

        <div className="calc__margin-box">
          <p className="calc__margin-title">Quick order-size comparison</p>
          <div className="decision-table-wrap" style={{ marginTop: "8px" }}>
            <table className="decision-table">
              <thead>
                <tr>
                  <th scope="col">Tier</th>
                  <th scope="col">Units / Ctns</th>
                  <th scope="col">Goods Outlay</th>
                  <th scope="col">Volume</th>
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((s) => (
                  <tr key={s.label}>
                    <th scope="row">{s.label}</th>
                    <td>
                      {s.units} ({s.cartons} ctns)
                    </td>
                    <td>{usd(s.totalGoodsUsd)}</td>
                    <td>{s.totalCbm} CBM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />

        <div className="calc__cta-box">
          <p>Next step: estimate international freight, duties, and full per-unit landed cost.</p>
          <div className="calc__cta-links">
            <Link href="/tools/landed-cost-calculator" className="arrow-link">
              <span>Landed Cost Calculator</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link href="/tools/shipping-cost-calculator" className="arrow-link">
              <span>Shipping &amp; CBM Calculator</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link href={sourcingContactHref} className="arrow-link">
              <span>Request a sourcing quote</span>
              <Icon name="arrow-up-right" size={15} />
            </Link>
          </div>
        </div>
      </output>
    </div>
  );
}
