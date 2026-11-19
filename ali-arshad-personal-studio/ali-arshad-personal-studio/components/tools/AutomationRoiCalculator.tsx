"use client";

import { useState } from "react";
import { roi } from "@/lib/tools/roi";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
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
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function AutomationRoiCalculator() {
  const [hoursPerWeek, setHours] = useState(8);
  const [hourlyCost, setCost] = useState(35);
  const [people, setPeople] = useState(2);
  const [factorPct, setFactorPct] = useState(60);
  const [buildCost, setBuild] = useState(4000);

  const r = roi({ hoursPerWeek, hourlyCost, people, automationFactor: factorPct / 100, buildCost });

  return (
    <div className="calc">
      <div className="calc__fields">
        <NumberField label="Hours on the task, per person" suffix="per week" value={hoursPerWeek} onChange={setHours} />
        <NumberField label="Fully-loaded hourly cost" suffix="USD" value={hourlyCost} onChange={setCost} />
        <NumberField label="People doing this task" value={people} onChange={setPeople} />
        <label className="calc__field">
          <span>Share of the work automated: {factorPct}%</span>
          <input type="range" min={0} max={90} value={factorPct} onChange={(e) => setFactorPct(Number(e.target.value))} />
        </label>
        <NumberField label="One-time build cost" suffix="USD" value={buildCost} onChange={setBuild} step={100} />
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Estimated annual saving</p>
        <p className="calc__out-value">{usd(r.annualSaving)}</p>
        <p className="calc__out-sub">
          {usd(r.weeklySaving)} per week ·{" "}
          {Number.isFinite(r.paybackWeeks) ? `pays back in ~${Math.round(r.paybackWeeks)} weeks` : "no saving at these inputs"}
        </p>
        {Number.isFinite(r.paybackWeeks) ? (
          <p className="calc__out-sub">
            First-year ROI: {r.firstYearRoiPct > 0 ? "+" : ""}
            {Math.round(r.firstYearRoiPct)}%
          </p>
        ) : null}
      </output>
    </div>
  );
}
