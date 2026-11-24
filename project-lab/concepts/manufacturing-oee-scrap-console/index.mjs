/**
 * Representative runnable workflow prototype for Sample Scenario: "Production Line Downtime & Scrap Rate Board"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "manufacturing-oee-scrap-console",
  title: "Production Line Downtime & Scrap Rate Board",
  niche: "Business Dashboards & Analytics",
  status: "Sample Scenario",
  stages: ["Shift throughput & yield summary cards","Downtime reason-code Pareto breakdown","Scrap rate trend by machine & SKU","Printable morning standup sheet"],
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
