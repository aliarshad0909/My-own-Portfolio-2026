"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import {
  ESTIMATOR_LIMITS,
  PROJECT_CATEGORIES,
  buildProposalHref,
  estimateProject,
  getProjectCategory,
  type BackendRequirement,
  type DesignComplexity,
  type MaintenancePlan,
  type ProjectCategoryId,
  type ProjectEstimateInput,
  type ScopeTier,
  type TimelinePreference,
} from "@/lib/tools/estimator";

const INITIAL_INPUT: ProjectEstimateInput = {
  category: "website-development",
  scopeTier: "growth",
  units: 6,
  designComplexity: "custom",
  backendNeeds: "standard",
  integrations: 2,
  authRequired: false,
  automationRequired: false,
  timeline: "standard",
  maintenance: "handoff",
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function WebProjectEstimator() {
  const [input, setInput] = useState<ProjectEstimateInput>(INITIAL_INPUT);
  const categoryMeta = getProjectCategory(input.category);
  const result = estimateProject(input);
  const proposalHref = buildProposalHref(result);

  const handleCategoryChange = (nextCategory: ProjectCategoryId) => {
    const meta = getProjectCategory(nextCategory);
    setInput((prev) => ({
      ...prev,
      category: nextCategory,
      units: meta.defaultUnits,
      backendNeeds: meta.hasSoftwareOptions ? prev.backendNeeds : "none",
      authRequired: meta.hasSoftwareOptions ? prev.authRequired : false,
    }));
  };

  const summaryText = [
    `Project Estimate — ${result.categoryLabel}`,
    `Estimated complexity: ${result.complexity}`,
    `Indicative budget range: ${usd(result.low)} – ${usd(result.high)}`,
    `Estimated delivery timeframe: ${result.weeksLow}–${result.weeksHigh} weeks`,
    `Scope summary: ${result.scopeSummary}`,
    "",
    "Selected requirements:",
    ...result.selectedRequirements.map((req) => `- ${req}`),
    "",
    "Note: Illustrative planning range only — final quotes are prepared individually after discovery.",
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <label className="calc__field">
          <span>Project category</span>
          <select value={input.category} onChange={(e) => handleCategoryChange(e.target.value as ProjectCategoryId)}>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="calc__field">
          <legend>Project / deliverable scope tier</legend>
          <div className="calc__choices">
            {(
              [
                { id: "starter", label: "Starter / MVP" },
                { id: "growth", label: "Production Business" },
                { id: "custom", label: "Full Custom System" },
              ] as { id: ScopeTier; label: string }[]
            ).map((opt) => (
              <label key={opt.id} className={`calc__choice ${input.scopeTier === opt.id ? "is-on" : ""}`}>
                <input
                  type="radio"
                  name="scope-tier"
                  checked={input.scopeTier === opt.id}
                  onChange={() => setInput((p) => ({ ...p, scopeTier: opt.id }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="calc__field">
          <span>
            {categoryMeta.unitLabel}: <strong>{input.units}</strong>
          </span>
          <input
            type="range"
            min={ESTIMATOR_LIMITS.pages.min}
            max={ESTIMATOR_LIMITS.pages.max}
            value={input.units}
            onChange={(e) => setInput((p) => ({ ...p, units: Number(e.target.value) }))}
          />
        </label>

        <fieldset className="calc__field">
          <legend>Design &amp; creative complexity</legend>
          <div className="calc__choices">
            {(
              [
                { id: "clean", label: "Clean & structured" },
                { id: "custom", label: "Custom brand system" },
                { id: "bespoke", label: "Bespoke + motion" },
              ] as { id: DesignComplexity; label: string }[]
            ).map((opt) => (
              <label key={opt.id} className={`calc__choice ${input.designComplexity === opt.id ? "is-on" : ""}`}>
                <input
                  type="radio"
                  name="design-complexity"
                  checked={input.designComplexity === opt.id}
                  onChange={() => setInput((p) => ({ ...p, designComplexity: opt.id }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        {categoryMeta.hasSoftwareOptions ? (
          <fieldset className="calc__field">
            <legend>Backend &amp; data requirements</legend>
            <div className="calc__choices">
              {(
                [
                  { id: "none", label: "Frontend / static" },
                  { id: "standard", label: "Standard API / CMS" },
                  { id: "advanced", label: "Custom logic & DB" },
                ] as { id: BackendRequirement; label: string }[]
              ).map((opt) => (
                <label key={opt.id} className={`calc__choice ${input.backendNeeds === opt.id ? "is-on" : ""}`}>
                  <input
                    type="radio"
                    name="backend-needs"
                    checked={input.backendNeeds === opt.id}
                    onChange={() => setInput((p) => ({ ...p, backendNeeds: opt.id }))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <label className="calc__field">
          <span>
            External integrations (CRM, Stripe, APIs, webhooks): <strong>{input.integrations}</strong>
          </span>
          <input
            type="range"
            min={ESTIMATOR_LIMITS.integrations.min}
            max={ESTIMATOR_LIMITS.integrations.max}
            value={input.integrations}
            onChange={(e) => setInput((p) => ({ ...p, integrations: Number(e.target.value) }))}
          />
        </label>

        <fieldset className="calc__field">
          <legend>Additional capabilities</legend>
          <div className="calc__choices">
            {categoryMeta.hasSoftwareOptions ? (
              <label className={`calc__choice ${input.authRequired ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={input.authRequired}
                  onChange={(e) => setInput((p) => ({ ...p, authRequired: e.target.checked }))}
                />
                User authentication &amp; roles
              </label>
            ) : null}
            <label className={`calc__choice ${input.automationRequired ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={input.automationRequired}
                onChange={(e) => setInput((p) => ({ ...p, automationRequired: e.target.checked }))}
              />
              AI / n8n workflow automation
            </label>
          </div>
        </fieldset>

        <fieldset className="calc__field">
          <legend>Delivery timeline</legend>
          <div className="calc__choices">
            {(
              [
                { id: "flexible", label: "Flexible" },
                { id: "standard", label: "Standard" },
                { id: "rush", label: "Priority / Rush" },
              ] as { id: TimelinePreference; label: string }[]
            ).map((opt) => (
              <label key={opt.id} className={`calc__choice ${input.timeline === opt.id ? "is-on" : ""}`}>
                <input
                  type="radio"
                  name="timeline-pref"
                  checked={input.timeline === opt.id}
                  onChange={() => setInput((p) => ({ ...p, timeline: opt.id }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="calc__field">
          <legend>Post-launch maintenance</legend>
          <div className="calc__choices">
            {(
              [
                { id: "none", label: "One-off delivery" },
                { id: "handoff", label: "Docs & hand-off" },
                { id: "ongoing", label: "Ongoing support" },
              ] as { id: MaintenancePlan; label: string }[]
            ).map((opt) => (
              <label key={opt.id} className={`calc__choice ${input.maintenance === opt.id ? "is-on" : ""}`}>
                <input
                  type="radio"
                  name="maintenance-plan"
                  checked={input.maintenance === opt.id}
                  onChange={() => setInput((p) => ({ ...p, maintenance: opt.id }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <output className="calc__out" aria-live="polite">
        <div className="calc__out-head">
          <p className="calc__out-label">Indicative budget range</p>
          <span className="badge badge--demo">{result.complexity} complexity</span>
        </div>

        <p className="calc__out-value">
          {usd(result.low)} – {usd(result.high)}
        </p>

        <p className="calc__out-pill">
          Estimated delivery: <strong>{result.weeksLow}–{result.weeksHigh} weeks</strong>
        </p>

        <p className="calc__summary-text">{result.scopeSummary}</p>

        <div className="calc__req-block">
          <p className="calc__req-title">Selected requirements</p>
          <ul className="calc__req-list">
            {result.selectedRequirements.map((req) => (
              <li key={req}>
                <Icon name="check" size={14} />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="calc__proposal-cta">
          <Link href={proposalHref} className="btn btn--primary btn--md calc__proposal-btn">
            <span>Request a Project Proposal</span>
            <Icon name="arrow-up-right" size={17} className="btn__icon" />
          </Link>
          <small className="calc__hint">Pre-fills your scope summary, service category, budget band and timeline on the contact page.</small>
        </div>

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL_INPUT)} />
      </output>
    </div>
  );
}
