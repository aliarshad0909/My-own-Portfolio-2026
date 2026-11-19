"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import { roi, ROI_LIMITS } from "@/lib/tools/roi";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const hrs = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} hrs`;

const DEFAULTS = {
  people: 2,
  hoursPerWeek: 8,
  hourlyCost: 35,
  workingWeeksPerYear: 48,
  factorPct: 60,
  buildCost: 4000,
  monthlySoftwareCost: 90,
};

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
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
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const parsed = e.target.value === "" ? 0 : Number(e.target.value);
          const bounded = Number.isFinite(parsed) ? Math.max(parsed, min) : min;
          onChange(typeof max === "number" ? Math.min(bounded, max) : bounded);
        }}
      />
    </label>
  );
}

export function AutomationRoiCalculator() {
  const [people, setPeople] = useState(DEFAULTS.people);
  const [hoursPerWeek, setHours] = useState(DEFAULTS.hoursPerWeek);
  const [hourlyCost, setCost] = useState(DEFAULTS.hourlyCost);
  const [workingWeeksPerYear, setWeeks] = useState(DEFAULTS.workingWeeksPerYear);
  const [factorPct, setFactorPct] = useState(DEFAULTS.factorPct);
  const [buildCost, setBuild] = useState(DEFAULTS.buildCost);
  const [monthlySoftwareCost, setMonthlySoftware] = useState(DEFAULTS.monthlySoftwareCost);

  const r = roi({
    hoursPerWeek,
    hourlyCost,
    people,
    automationFactor: factorPct / 100,
    buildCost,
    workingWeeksPerYear,
    monthlySoftwareCost,
  });

  const handleReset = () => {
    setPeople(DEFAULTS.people);
    setHours(DEFAULTS.hoursPerWeek);
    setCost(DEFAULTS.hourlyCost);
    setWeeks(DEFAULTS.workingWeeksPerYear);
    setFactorPct(DEFAULTS.factorPct);
    setBuild(DEFAULTS.buildCost);
    setMonthlySoftware(DEFAULTS.monthlySoftwareCost);
  };

  const paybackText = Number.isFinite(r.paybackMonths)
    ? `${r.paybackMonths.toFixed(1)} months (~${Math.round(r.paybackWeeks)} weeks)`
    : "No positive payback at current inputs";

  const summaryText = [
    `Automation ROI Estimate`,
    `Team: ${people} employee(s) × ${hoursPerWeek} hrs/week × ${workingWeeksPerYear} weeks/year @ ${usd(hourlyCost)}/hr`,
    `Automation coverage: ${factorPct}% (capped at 90%)`,
    `Hours saved: ${hrs(r.weeklyHoursSaved)}/week | ${hrs(r.monthlyHoursSaved)}/month | ${hrs(r.annualHoursSaved)}/year`,
    `Gross labour savings: ${usd(r.monthlyGrossSaving)}/month (${usd(r.annualSaving)}/year)`,
    `Ongoing software/maintenance: ${usd(monthlySoftwareCost)}/month (${usd(r.annualSoftwareCost)}/year)`,
    `Net monthly benefit: ${usd(r.monthlyNetBenefit)} | Net annual benefit: ${usd(r.annualNetSaving)}`,
    `Initial implementation cost: ${usd(buildCost)}`,
    `Estimated payback period: ${paybackText}`,
    `Estimated first-year ROI: ${r.firstYearRoiPct > 0 ? "+" : ""}${Math.round(r.firstYearRoiPct)}%`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <NumberField label="Employees doing this task" value={people} onChange={setPeople} min={0} step={1} />
          <NumberField label="Weekly hours per employee" suffix="hrs/wk" value={hoursPerWeek} onChange={setHours} step={0.5} />
        </div>

        <div className="calc__row">
          <NumberField label="Average hourly labour cost" suffix="USD" value={hourlyCost} onChange={setCost} step={1} />
          <NumberField
            label="Working weeks per year"
            suffix="1–52"
            value={workingWeeksPerYear}
            onChange={setWeeks}
            min={ROI_LIMITS.workingWeeksPerYear.min}
            max={ROI_LIMITS.workingWeeksPerYear.max}
          />
        </div>

        <label className="calc__field">
          <span>Estimated percentage automated: {factorPct}% (max 90%)</span>
          <input type="range" min={0} max={90} value={factorPct} onChange={(e) => setFactorPct(Number(e.target.value))} />
          <small className="calc__hint">Capped at 90% because reliable automation keeps human review for exceptions.</small>
        </label>

        <div className="calc__row">
          <NumberField label="Initial implementation cost" suffix="USD" value={buildCost} onChange={setBuild} step={250} />
          <NumberField
            label="Monthly software / maintenance"
            suffix="USD/mo"
            value={monthlySoftwareCost}
            onChange={setMonthlySoftware}
            step={10}
          />
        </div>
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Estimated annual net savings</p>
        <p className={`calc__out-value ${r.annualNetSaving < 0 ? "is-neg" : ""}`}>{usd(r.annualNetSaving)}</p>
        <p className="calc__out-pill">
          {Number.isFinite(r.paybackMonths) ? (
            <>
              Payback in <strong>{r.paybackMonths.toFixed(1)} months</strong> (~{Math.round(r.paybackWeeks)} weeks) · First-year ROI{" "}
              <strong>
                {r.firstYearRoiPct > 0 ? "+" : ""}
                {Math.round(r.firstYearRoiPct)}%
              </strong>
            </>
          ) : (
            "Monthly software cost exceeds gross labour savings"
          )}
        </p>

        <dl className="calc__breakdown">
          <div>
            <dt>Weekly hours saved</dt>
            <dd>{hrs(r.weeklyHoursSaved)}</dd>
          </div>
          <div>
            <dt>Monthly hours saved</dt>
            <dd>{hrs(r.monthlyHoursSaved)}</dd>
          </div>
          <div>
            <dt>Annual hours saved</dt>
            <dd>{hrs(r.annualHoursSaved)}</dd>
          </div>
          <div>
            <dt>Monthly gross labour savings</dt>
            <dd>{usd(r.monthlyGrossSaving)}</dd>
          </div>
          <div>
            <dt>Annual gross labour savings</dt>
            <dd>{usd(r.annualSaving)}</dd>
          </div>
          <div>
            <dt>Monthly software &amp; maintenance</dt>
            <dd>-{usd(monthlySoftwareCost)}</dd>
          </div>
          <div>
            <dt>Monthly net benefit</dt>
            <dd>
              <strong>{usd(r.monthlyNetBenefit)}</strong>
            </dd>
          </div>
          <div>
            <dt>Initial investment</dt>
            <dd>{usd(buildCost)}</dd>
          </div>
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={handleReset} />

        <div className="calc__cta-box">
          <p>
            <strong>Want to automate this process?</strong> Let&rsquo;s discuss your workflow.
          </p>
          <div className="calc__cta-links">
            <Link
              href={`/contact?service=${encodeURIComponent("AI Agents & Automation")}&summary=${encodeURIComponent(summaryText)}`}
              className="btn btn--primary btn--sm"
            >
              <span>Discuss Your Workflow</span>
              <Icon name="arrow-up-right" size={16} className="btn__icon" />
            </Link>
            <Link href="/services/n8n-automation" className="arrow-link">
              <span>n8n Automation Services</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </output>
    </div>
  );
}
