"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import {
  COMMON_COUNTRIES,
  SHIPPING_METHODS,
  calculateShippingCost,
  convertShippingUnitSystem,
  getShippingMethod,
  type ShippingCostInput,
  type ShippingMethodId,
  type ShippingUnitSystem,
} from "@/lib/tools/shipping";

const INITIAL_INPUT: ShippingCostInput = {
  originCountry: "China",
  destinationCountry: "United States",
  method: "air-express",
  unitSystem: "metric",
  actualWeight: 12,
  length: 50,
  width: 40,
  height: 35,
  volumetricDivisor: 5000,
  ratePerChargeableUnit: 8.5,
  handlingCharges: 35,
  cartonCount: 1,
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ShippingCostCalculator() {
  const [input, setInput] = useState<ShippingCostInput>(INITIAL_INPUT);
  const r = calculateShippingCost(input);
  const methodMeta = getShippingMethod(input.method);

  const setNum = (key: keyof ShippingCostInput, raw: string) => {
    const parsed = raw === "" ? 0 : Number(raw);
    setInput((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? Math.max(parsed, 0) : 0 }));
  };

  const handleUnitToggle = (nextUnit: ShippingUnitSystem) => {
    setInput((prev) => convertShippingUnitSystem(prev, nextUnit));
  };

  const handleMethodChange = (nextMethod: ShippingMethodId) => {
    const meta = getShippingMethod(nextMethod);
    setInput((prev) => ({
      ...prev,
      method: nextMethod,
      volumetricDivisor: prev.unitSystem === "metric" ? meta.defaultDivisorMetric : meta.defaultDivisorImperial,
      ratePerChargeableUnit: prev.unitSystem === "metric" ? meta.suggestedRateMetricUsd : meta.suggestedRateImperialUsd,
    }));
  };

  const summaryText = [
    `Shipping Cost Estimate (${input.originCountry} → ${input.destinationCountry})`,
    `Method: ${methodMeta.label} (${input.unitSystem === "metric" ? "kg / cm" : "lb / in"})`,
    `Dimensions: ${input.length} × ${input.width} × ${input.height} ${r.dimensionUnit} (${r.volumeCbm} CBM)`,
    `Actual weight: ${r.actualWeight} ${r.weightUnit} (${r.actualWeightKg} kg)`,
    `Volumetric weight (divisor ${input.volumetricDivisor}): ${r.volumetricWeight} ${r.weightUnit} (${r.volumetricWeightKg} kg)`,
    `Chargeable weight: ${r.chargeableWeight} ${r.weightUnit} (billed by ${r.billedBy} weight)`,
    `Freight: ${usd(r.freightCost)} + Handling: ${usd(r.handlingCharges)}`,
    `Estimated total shipping cost: ${usd(r.totalEstimatedCost)}`,
    `Note: Planning estimate only — not a live carrier quote.`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__toolbar">
          <fieldset className="calc__field">
            <legend>Measurement units</legend>
            <div className="calc__choices" role="radiogroup" aria-label="Measurement units">
              {(
                [
                  { id: "metric", label: "Metric (kg / cm)" },
                  { id: "imperial", label: "Imperial (lb / in)" },
                ] as { id: ShippingUnitSystem; label: string }[]
              ).map((opt) => (
                <label key={opt.id} className={`calc__choice ${input.unitSystem === opt.id ? "is-on" : ""}`}>
                  <input
                    type="radio"
                    name="shipping-units"
                    checked={input.unitSystem === opt.id}
                    onChange={() => handleUnitToggle(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Origin country</span>
            <select
              value={input.originCountry}
              onChange={(e) => setInput((p) => ({ ...p, originCountry: e.target.value }))}
            >
              {COMMON_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="calc__field">
            <span>Destination country</span>
            <select
              value={input.destinationCountry}
              onChange={(e) => setInput((p) => ({ ...p, destinationCountry: e.target.value }))}
            >
              {COMMON_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="calc__field">
          <span>Shipping method</span>
          <select value={input.method} onChange={(e) => handleMethodChange(e.target.value as ShippingMethodId)}>
            {SHIPPING_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <small className="calc__hint">{methodMeta.note}</small>
        </label>

        <div className="calc__row calc__row--3">
          <label className="calc__field">
            <span>
              Weight / carton <span className="calc__suffix">({r.weightUnit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={input.actualWeight}
              onChange={(e) => setNum("actualWeight", e.target.value)}
            />
          </label>

          <label className="calc__field">
            <span>
              Cartons <span className="calc__suffix">(qty)</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={input.cartonCount ?? 1}
              onChange={(e) => setNum("cartonCount", e.target.value || "1")}
            />
          </label>

          <label className="calc__field">
            <span>
              Volumetric divisor{" "}
              <span className="calc__suffix">({input.unitSystem === "metric" ? "cm³/kg" : "in³/lb"})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              step={10}
              value={input.volumetricDivisor}
              onChange={(e) => setNum("volumetricDivisor", e.target.value)}
            />
          </label>
        </div>

        <div className="calc__row calc__row--3">
          <label className="calc__field">
            <span>
              Length <span className="calc__suffix">({r.dimensionUnit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={input.length}
              onChange={(e) => setNum("length", e.target.value)}
            />
          </label>
          <label className="calc__field">
            <span>
              Width <span className="calc__suffix">({r.dimensionUnit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={input.width}
              onChange={(e) => setNum("width", e.target.value)}
            />
          </label>
          <label className="calc__field">
            <span>
              Height <span className="calc__suffix">({r.dimensionUnit})</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={input.height}
              onChange={(e) => setNum("height", e.target.value)}
            />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>
              Rate per chargeable {r.weightUnit} <span className="calc__suffix">(USD)</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={input.ratePerChargeableUnit}
              onChange={(e) => setNum("ratePerChargeableUnit", e.target.value)}
            />
          </label>

          <label className="calc__field">
            <span>
              Additional handling &amp; fees <span className="calc__suffix">(USD)</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={5}
              value={input.handlingCharges}
              onChange={(e) => setNum("handlingCharges", e.target.value)}
            />
          </label>
        </div>
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Estimated shipping cost</p>
        <p className="calc__out-value">{usd(r.totalEstimatedCost)}</p>
        <p className="calc__out-pill">
          Billed on{" "}
          <strong>
            {r.billedBy === "volumetric" ? "volumetric weight" : r.billedBy === "actual" ? "actual weight" : "equal actual & volumetric weight"}
          </strong>
        </p>

        <dl className="calc__breakdown">
          <div>
            <dt>Route</dt>
            <dd>
              {input.originCountry} → {input.destinationCountry}
            </dd>
          </div>
          <div>
            <dt>Actual weight</dt>
            <dd>
              {r.actualWeight} {r.weightUnit}
              {r.unitSystem === "imperial" ? ` (${r.actualWeightKg} kg)` : ""}
            </dd>
          </div>
          <div>
            <dt>Volumetric weight</dt>
            <dd>
              {r.volumetricWeight} {r.weightUnit}
              {r.unitSystem === "imperial" ? ` (${r.volumetricWeightKg} kg)` : ""}
            </dd>
          </div>
          <div>
            <dt>Chargeable weight</dt>
            <dd>
              <strong>
                {r.chargeableWeight} {r.weightUnit}
              </strong>
            </dd>
          </div>
          <div>
            <dt>Shipment volume</dt>
            <dd>{r.volumeCbm} CBM</dd>
          </div>
          <div>
            <dt>Freight charge</dt>
            <dd>{usd(r.freightCost)}</dd>
          </div>
          <div>
            <dt>Handling charges</dt>
            <dd>{usd(r.handlingCharges)}</dd>
          </div>
          {r.effectiveCostPerActualUnit > 0 ? (
            <div>
              <dt>Effective rate per actual {r.weightUnit}</dt>
              <dd>{usd(r.effectiveCostPerActualUnit)}</dd>
            </div>
          ) : null}
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL_INPUT)} />

        <div className="calc__cta-box">
          <p>Need full per-unit import pricing including customs duties and taxes?</p>
          <Link href="/tools/landed-cost-calculator" className="arrow-link">
            <span>Open Landed Cost Calculator</span>
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </output>
    </div>
  );
}

