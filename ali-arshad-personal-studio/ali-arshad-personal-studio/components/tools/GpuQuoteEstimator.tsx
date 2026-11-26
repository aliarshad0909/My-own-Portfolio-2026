"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import { GPU_COMPUTE_CONTACT_SERVICE } from "@/lib/gpu-compute";
import {
  GPU_ACCESS_LABELS,
  GPU_STORAGE_LABELS,
  GPU_WORKLOAD_LABELS,
  evaluateGpuQuoteScope,
  type GpuAccessPreference,
  type GpuQuoteScopeInput,
  type GpuStorageNeed,
  type GpuWorkloadCategory,
} from "@/lib/tools/gpu-estimator";

const INITIAL: GpuQuoteScopeInput = {
  workloadCategory: "blender-rendering",
  estimatedHoursPerRun: 4,
  runsPerMonth: 2,
  vramRequirementGb: 12,
  systemRamRequirementGb: 32,
  storageGb: 80,
  accessPreference: "ssh-key",
  storageNeed: "ephemeral-scratch",
  needsSetupAssistance: false,
  requires247Uptime: false,
  requiresComplianceCert: false,
};

export function GpuQuoteEstimator() {
  const [input, setInput] = useState<GpuQuoteScopeInput>(INITIAL);
  const res = evaluateGpuQuoteScope(input);

  const contactHref = `/contact?service=${encodeURIComponent(GPU_COMPUTE_CONTACT_SERVICE)}&summary=${encodeURIComponent(res.contactSummary)}`;

  const setNum = (key: "estimatedHoursPerRun" | "runsPerMonth" | "vramRequirementGb" | "systemRamRequirementGb" | "storageGb", raw: string) => {
    const n = raw === "" ? 1 : Number(raw);
    setInput((prev) => ({ ...prev, [key]: Number.isFinite(n) ? Math.max(n, 1) : 1 }));
  };

  return (
    <div className="calc">
      <div className="calc__fields">
        <label className="calc__field">
          <span>Primary workload type</span>
          <select
            value={input.workloadCategory}
            onChange={(e) => setInput((p) => ({ ...p, workloadCategory: e.target.value as GpuWorkloadCategory }))}
          >
            {Object.entries(GPU_WORKLOAD_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="calc__row">
          <label className="calc__field">
            <span>Estimated hours per run</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              step={1}
              value={input.estimatedHoursPerRun}
              onChange={(e) => setNum("estimatedHoursPerRun", e.target.value)}
            />
          </label>
          <label className="calc__field">
            <span>Expected runs per month</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={input.runsPerMonth}
              onChange={(e) => setNum("runsPerMonth", e.target.value)}
            />
          </label>
        </div>

        <div className="calc__row calc__row--3">
          <label className="calc__field">
            <span>
              Est. VRAM <span className="calc__suffix">(GB)</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={input.vramRequirementGb}
              onChange={(e) => setNum("vramRequirementGb", e.target.value)}
            />
          </label>
          <label className="calc__field">
            <span>
              Est. host RAM <span className="calc__suffix">(GB)</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={4}
              step={4}
              value={input.systemRamRequirementGb}
              onChange={(e) => setNum("systemRamRequirementGb", e.target.value)}
            />
          </label>
          <label className="calc__field">
            <span>
              Working storage <span className="calc__suffix">(GB)</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              step={10}
              value={input.storageGb}
              onChange={(e) => setNum("storageGb", e.target.value)}
            />
          </label>
        </div>

        <div className="calc__row">
          <label className="calc__field">
            <span>Preferred access model</span>
            <select
              value={input.accessPreference}
              onChange={(e) => setInput((p) => ({ ...p, accessPreference: e.target.value as GpuAccessPreference }))}
            >
              {Object.entries(GPU_ACCESS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="calc__field">
            <span>Storage persistence need</span>
            <select
              value={input.storageNeed}
              onChange={(e) => setInput((p) => ({ ...p, storageNeed: e.target.value as GpuStorageNeed }))}
            >
              {Object.entries(GPU_STORAGE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="calc__field">
          <span>Operational checks</span>
          <label className="skill-check">
            <input
              type="checkbox"
              checked={input.needsSetupAssistance}
              onChange={(e) => setInput((p) => ({ ...p, needsSetupAssistance: e.target.checked }))}
            />
            <span>Include environment / Docker / Blender setup assistance in quote</span>
          </label>
          <label className="skill-check">
            <input
              type="checkbox"
              checked={input.requires247Uptime}
              onChange={(e) => setInput((p) => ({ ...p, requires247Uptime: e.target.checked }))}
            />
            <span>Requires 24/7 production uptime SLA or instant failover</span>
          </label>
          <label className="skill-check">
            <input
              type="checkbox"
              checked={input.requiresComplianceCert}
              onChange={(e) => setInput((p) => ({ ...p, requiresComplianceCert: e.target.checked }))}
            />
            <span>Requires certified compliance (SOC 2, HIPAA, PCI-DSS, or ISO 27001)</span>
          </label>
        </div>
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Quote-led feasibility screen</p>
        <p className="calc__out-value" style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.75rem)" }}>
          {res.fitHeadline}
        </p>
        <p className="calc__out-pill">
          Estimated runtime: <strong>{res.totalEstimatedHours} hrs / month</strong> · Pricing confirmed per request (no invented rate)
        </p>

        <dl className="calc__breakdown">
          <div>
            <dt>Workload class</dt>
            <dd>{GPU_WORKLOAD_LABELS[input.workloadCategory]}</dd>
          </div>
          <div>
            <dt>Requested footprint</dt>
            <dd>
              {input.vramRequirementGb} GB VRAM · {input.systemRamRequirementGb} GB RAM · {input.storageGb} GB disk
            </dd>
          </div>
          <div>
            <dt>Access &amp; storage</dt>
            <dd>{GPU_ACCESS_LABELS[input.accessPreference]}</dd>
          </div>
          <div>
            <dt>Pricing basis</dt>
            <dd>Custom written quote after live capacity check</dd>
          </div>
        </dl>

        {res.flags.length > 0 ? (
          <div className="notice" role="status" style={{ marginTop: "14px" }}>
            <Icon name="alert" size={16} />
            <div>
              <strong>Scope considerations flagged:</strong>
              <ul className="plain-list" style={{ marginTop: "6px" }}>
                {res.flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <ul className="fine-print plain-list" style={{ marginTop: "14px" }}>
          {res.assumptions.map((a) => (
            <li key={a}>• {a}</li>
          ))}
        </ul>

        <div className="hero__actions" style={{ marginTop: "18px" }}>
          <Link href={contactHref} className="btn btn--primary btn--sm">
            <span>Request availability &amp; quote with this brief</span>
            <Icon name="arrow-up-right" size={15} />
          </Link>
        </div>

        <CalculatorActions summaryText={res.contactSummary} onReset={() => setInput(INITIAL)} />
      </output>
    </div>
  );
}
