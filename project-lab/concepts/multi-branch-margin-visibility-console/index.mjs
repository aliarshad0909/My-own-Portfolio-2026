/**
 * Representative runnable workflow prototype for Sample Scenario: "Multi-Location Gross Margin & Cost Console"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "multi-branch-margin-visibility-console",
  title: "Multi-Location Gross Margin & Cost Console",
  niche: "Business Dashboards & Analytics",
  status: "Sample Scenario",
  stages: ["Branch-by-branch gross vs. net margin cards","Discount & freight drag waterfall chart","SKU profitability outlier filter","Exportable branch review CSV"],
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
