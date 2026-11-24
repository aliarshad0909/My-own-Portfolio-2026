/**
 * Representative runnable workflow prototype for Sample Scenario: "CRM-to-Accounting Invoice & Payment Sync Connector"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "accounting-ledger-connector-pipeline",
  title: "CRM-to-Accounting Invoice & Payment Sync Connector",
  niche: "API & System Integrations",
  status: "Sample Scenario",
  stages: ["Deterministic tax & SKU code mapping","Draft-only invoice safety boundary","Paid-status webhook back to CRM deal","Mismatch exception log"],
};

export function runRepresentativeWorkflow(input) {
  if (!input || typeof input.recordId !== "string" || input.recordId.trim() === "") {
    return { ok: false, error: "recordId_required", completedStages: [] };
  }
  const completedStages = WORKFLOW_SPEC.stages.map((stage, idx) => ({
    step: idx + 1,
    stage,
    status: "verified_synthetic",
    recordId: input.recordId.trim(),
  }));
  return {
    ok: true,
    slug: WORKFLOW_SPEC.slug,
    recordId: input.recordId.trim(),
    stageCount: completedStages.length,
    completedStages,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(runRepresentativeWorkflow({ recordId: "SYN-1001" }), null, 2));
}
