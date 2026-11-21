"use client";

import { useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { calculateSaasCost, type SaasCostInput } from "@/lib/tools/business-calculators";

const INITIAL: SaasCostInput = {
  currency: "USD",
  activeUsers: 500,
  initialBuildCost: 14000,
  hostingMonthly: 45,
  databaseMonthly: 25,
  aiApiMonthly: 90,
  thirdPartyToolsMonthly: 40,
  maintenanceHoursPerMonth: 8,
  hourlyRate: 75,
};

const fmt = (n: number, c: string) =>
  `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SaasCostCalculator() {
  const [input, setInput] = useState<SaasCostInput>(INITIAL);
  const r = calculateSaasCost(input);

  const setNum = (k: keyof SaasCostInput, raw: string) => {
    const val = raw === "" ? 0 : Number(raw);
    setInput((p) => ({ ...p, [k]: Number.isFinite(val) ? Math.max(0, val) : 0 }));
  };

  const summaryText = [
    `SaaS Operating & Year-1 TCO Estimate (${input.currency})`,
    `Active Users: ${input.activeUsers}`,
    `Monthly Infrastructure: ${fmt(r.monthlyInfraCost, input.currency)}`,
    `Monthly Engineering Maintenance: ${fmt(r.monthlyMaintenanceCost, input.currency)}`,
    `Monthly Run-Rate: ${fmt(r.monthlyOperatingTotal, input.currency)} (${fmt(r.costPerActiveUserMonthly, input.currency)}/user)`,
    `Annual Operating Cost: ${fmt(r.annualOperatingTotal, input.currency)}`,
    `Year-1 Total Cost of Ownership (Build + 12m Ops): ${fmt(r.yearOneTotalCost, input.currency)}`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <label className="calc__field">
            <span>Currency</span>
            <select
              value={input.currency}
              onChange={(e) => setInput((p) => ({ ...p, currency: e.target.value }))}
            >
              {["USD", "EUR", "GBP", "AED", "PKR"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="calc__field">
            <span>Monthly active users</span>
            <input type="number" min={1} value={input.activeUsers} onChange={(e) => setNum("activeUsers", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Initial build / MVP cost</span>
            <input type="number" min={0} value={input.initialBuildCost} onChange={(e) => setNum("initialBuildCost", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>App hosting &amp; CDN (/mo)</span>
            <input type="number" min={0} value={input.hostingMonthly} onChange={(e) => setNum("hostingMonthly", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Managed database (/mo)</span>
            <input type="number" min={0} value={input.databaseMonthly} onChange={(e) => setNum("databaseMonthly", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>AI / LLM &amp; external APIs (/mo)</span>
            <input type="number" min={0} value={input.aiApiMonthly} onChange={(e) => setNum("aiApiMonthly", e.target.value)} />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Auth, email &amp; monitoring (/mo)</span>
            <input type="number" min={0} value={input.thirdPartyToolsMonthly} onChange={(e) => setNum("thirdPartyToolsMonthly", e.target.value)} />
          </label>
          <label className="calc__field">
            <span>Maintenance hours (/mo)</span>
            <input type="number" min={0} value={input.maintenanceHoursPerMonth} onChange={(e) => setNum("maintenanceHoursPerMonth", e.target.value)} />
          </label>
        </div>

        <label className="calc__field">
          <span>Engineering hourly rate ({input.currency})</span>
          <input type="number" min={0} value={input.hourlyRate} onChange={(e) => setNum("hourlyRate", e.target.value)} />
        </label>
      </div>

      <div className="calc__output panel">
        <p className="eyebrow eyebrow--plain">Estimated SaaS TCO</p>
        <div className="calc__headline">{fmt(r.monthlyOperatingTotal, input.currency)} / mo</div>
        <p className="fine-print">
          Year-1 TCO (Build + 12m Ops): <strong>{fmt(r.yearOneTotalCost, input.currency)}</strong> ·{" "}
          <strong>{fmt(r.costPerActiveUserMonthly, input.currency)}</strong> / active user / mo
        </p>

        <dl className="calc__breakdown">
          {r.breakdown.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{fmt(row.monthly, input.currency)}/mo</dd>
            </div>
          ))}
          <div>
            <dt>Annual Operating Run-Rate</dt>
            <dd><strong>{fmt(r.annualOperatingTotal, input.currency)}</strong></dd>
          </div>
        </dl>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL)} />
      </div>
    </div>
  );
}
