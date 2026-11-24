/**
 * Representative runnable workflow prototype for Sample Scenario: "Automated Monday Executive Metrics Digest"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "n8n-weekly-executive-digest-compiler",
  title: "Automated Monday Executive Metrics Digest",
  niche: "n8n & Workflow Automation",
  status: "Sample Scenario",
  stages: ["Read-only multi-source KPI aggregation","Week-over-week percentage delta calculation","Zero-dependency table-based HTML email","Graceful partial-source warning banner"],
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
