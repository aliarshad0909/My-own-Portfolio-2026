"use client";

import { useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { calculateProjectBudget, type ProjectBudgetInput } from "@/lib/tools/business-calculators";

const INITIAL: ProjectBudgetInput = {
  currency: "USD",
  durationWeeks: 8,
  engineeringHours: 180,
  engineeringRate: 85,
  designHours: 48,
  designRate: 75,
  qaDevOpsHours: 32,
  qaDevOpsRate: 70,
  pmHours: 24,
  pmRate: 80,
  directSoftwareCosts: 650,
  contingencyPct: 15,
};

const fmt = (n: number, c: string) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ProjectBudgetCalculator() {
  const [input, setInput] = useState<ProjectBudgetInput>(INITIAL);
  const r = calculateProjectBudget(input);

  const setNum = (k: keyof ProjectBudgetInput, raw: string) => {
    const val = raw === "" ? 0 : Number(raw);
    setInput((p) => ({ ...p, [k]: Number.isFinite(val) ? Math.max(0, val) : 0 }));
  };

  const summaryText = [
    `Software Project Budget Breakdown (${input.currency} · ${input.durationWeeks} weeks)`,
    `Total Effort: ${r.totalHours} hours (Blended rate: ${fmt(r.blendedHourlyRate, input.currency)}/hr)`,
    ...r.roles.map((role) => `- ${role.role}: ${role.hours}h = ${fmt(role.cost, input.currency)}`),
    `Direct Software / Hosting Costs: ${fmt(r.directCosts, input.currency)}`,
    `Contingency Reserve (${input.contingencyPct}%): ${fmt(r.contingencyAmount, input.currency)}`,
    `Grand Total Budget: ${fmt(r.grandTotal, input.currency)} (Weekly Burn: ${fmt(r.weeklyBurnRate, input.currency)}/wk)`,
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
            <span>Target duration (weeks)</span>
            <input type="number" min={1} value={input.durationWeeks} onChange={(e) => setNum("durationWeeks", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Engineering hours</span>
            <input type="number" min={0} value={input.engineeringHours} onChange={(e) => setNum("engineeringHours", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Engineering rate (/hr)</span>
            <input type="number" min={0} value={input.engineeringRate} onChange={(e) => setNum("engineeringRate", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Product &amp; UI/UX design hours</span>
            <input type="number" min={0} value={input.designHours} onChange={(e) => setNum("designHours", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Design rate (/hr)</span>
            <input type="number" min={0} value={input.designRate} onChange={(e) => setNum("designRate", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>QA &amp; DevOps hours</span>
            <input type="number" min={0} value={input.qaDevOpsHours} onChange={(e) => setNum("qaDevOpsHours", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>QA &amp; DevOps rate (/hr)</span>
            <input type="number" min={0} value={input.qaDevOpsRate} onChange={(e) => setNum("qaDevOpsRate", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Architecture / PM hours</span>
            <input type="number" min={0} value={input.pmHours} onChange={(e) => setNum("pmHours", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>PM rate (/hr)</span>
            <input type="number" min={0} value={input.pmRate} onChange={(e) => setNum("pmRate", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Direct software &amp; cloud costs</span>
            <input type="number" min={0} value={input.directSoftwareCosts} onChange={(e) => setNum("directSoftwareCosts", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Contingency reserve (%)</span>
            <input type="number" min={0} max={50} value={input.contingencyPct} onChange={(e) => setNum("contingencyPct", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="calc__output panel">
        <p className="eyebrow eyebrow--plain">Total Project Budget</p>
        <div className="calc__headline">{fmt(r.grandTotal, input.currency)}</div>
        <p className="fine-print">
          {r.totalHours} total hours · Weekly burn: <strong>{fmt(r.weeklyBurnRate, input.currency)}/wk</strong> ·
          Blended rate: <strong>{fmt(r.blendedHourlyRate, input.currency)}/hr</strong>
        </p>

        <dl className="calc__breakdown">
          {r.roles.map((role) => (
            <div key={role.role}>
              <dt>{role.role} ({role.hours}h)</dt>
              <dd>{fmt(role.cost, input.currency)}</dd>
            </div>
          ))}
          <div><dt>Direct Non-Labor Costs</dt><dd>{fmt(r.directCosts, input.currency)}</dd></div>
          <div><dt>Contingency ({input.contingencyPct}%)</dt><dd>{fmt(r.contingencyAmount, input.currency)}</dd></div>
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />
      </div>
    </div>
  );
}
