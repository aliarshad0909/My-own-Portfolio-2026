"use client";

import { useState } from "react";
import { landedCost } from "@/lib/tools/landed-cost";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="calc__field">
      <span>
        {label}
        {suffix ? <span className="calc__suffix"> ({suffix})</span> : null}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function LandedCostCalculator() {
  const [unitCost, setUnitCost] = useState(8);
  const [quantity, setQuantity] = useState(500);
  const [freight, setFreight] = useState(900);
  const [dutyRatePct, setDuty] = useState(6.5);
  const [insurance, setInsurance] = useState(120);
  const [otherFees, setOther] = useState(250);

  const r = landedCost({ unitCost, quantity, freight, dutyRatePct, insurance, otherFees });

  return (
    <div className="calc">
      <div className="calc__fields">
        <NumberField label="Unit cost from supplier" suffix="USD" value={unitCost} onChange={setUnitCost} step={0.1} />
        <NumberField label="Quantity" value={quantity} onChange={setQuantity} step={10} />
        <NumberField label="Total freight / shipping" suffix="USD" value={freight} onChange={setFreight} step={10} />
        <NumberField label="Import duty rate" suffix="%" value={dutyRatePct} onChange={setDuty} step={0.1} />
        <NumberField label="Insurance" suffix="USD" value={insurance} onChange={setInsurance} step={10} />
        <NumberField label="Other fees (brokerage, handling)" suffix="USD" value={otherFees} onChange={setOther} step={10} />
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Per-unit landed cost</p>
        <p className="calc__out-value">{usd(r.perUnitLandedCost)}</p>
        <p className="calc__out-sub">
          Total landed cost: {usd(r.totalLandedCost)} · {r.upliftFactor}× the raw goods value
        </p>
        <p className="calc__out-sub">
          Goods {usd(r.goodsValue)} + freight {usd(freight)} + duty {usd(r.duty)} + insurance {usd(insurance)} + fees{" "}
          {usd(otherFees)}
        </p>
      </output>
    </div>
  );
}
