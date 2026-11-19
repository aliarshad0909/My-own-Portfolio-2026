"use client";

import { useState } from "react";
import { estimate, ESTIMATOR_LIMITS, type DesignLevel, type ProjectType, type Urgency } from "@/lib/tools/estimator";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "marketing-site", label: "Marketing site" },
  { value: "web-app", label: "Web application" },
  { value: "ecommerce", label: "Ecommerce store" },
  { value: "dashboard", label: "Dashboard / internal tool" },
];

export function WebProjectEstimator() {
  const [projectType, setProjectType] = useState<ProjectType>("web-app");
  const [pages, setPages] = useState(8);
  const [integrations, setIntegrations] = useState(2);
  const [design, setDesign] = useState<DesignLevel>("custom");
  const [urgency, setUrgency] = useState<Urgency>("standard");

  const r = estimate({ projectType, pages, integrations, design, urgency });

  return (
    <div className="calc">
      <div className="calc__fields">
        <label className="calc__field">
          <span>Project type</span>
          <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="calc__field">
          <span>Pages / primary screens: {pages}</span>
          <input
            type="range"
            min={ESTIMATOR_LIMITS.pages.min}
            max={ESTIMATOR_LIMITS.pages.max}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
          />
        </label>

        <label className="calc__field">
          <span>Integrations: {integrations}</span>
          <input
            type="range"
            min={ESTIMATOR_LIMITS.integrations.min}
            max={ESTIMATOR_LIMITS.integrations.max}
            value={integrations}
            onChange={(e) => setIntegrations(Number(e.target.value))}
          />
        </label>

        <fieldset className="calc__field">
          <legend>Design</legend>
          <div className="calc__choices">
            {(["template", "custom"] as DesignLevel[]).map((d) => (
              <label key={d} className={`calc__choice ${design === d ? "is-on" : ""}`}>
                <input type="radio" name="design" checked={design === d} onChange={() => setDesign(d)} />
                {d === "template" ? "From a template" : "Fully custom"}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="calc__field">
          <legend>Timeline</legend>
          <div className="calc__choices">
            {(["standard", "rush"] as Urgency[]).map((u) => (
              <label key={u} className={`calc__choice ${urgency === u ? "is-on" : ""}`}>
                <input type="radio" name="urgency" checked={urgency === u} onChange={() => setUrgency(u)} />
                {u === "standard" ? "Standard" : "Rush"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Indicative budget range</p>
        <p className="calc__out-value">
          {usd(r.low)} – {usd(r.high)}
        </p>
        <p className="calc__out-sub">
          Rough timeline: {r.weeksLow}–{r.weeksHigh} weeks
        </p>
      </output>
    </div>
  );
}
