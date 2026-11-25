/**
 * Representative runnable workflow prototype for Sample Scenario: "Regional Fleet Utilization & Delivery SLA Monitor"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "fleet-utilization-route-kpi-monitor",
  title: "Regional Fleet Utilization & Delivery SLA Monitor",
  niche: "Business Dashboards & Analytics",
  status: "Sample Scenario",
  stages: ["On-time vs. delayed stop breakdown","Cost-per-mile & idle-time trend charts","Vehicle maintenance threshold flags","Shift handover export view"],
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
