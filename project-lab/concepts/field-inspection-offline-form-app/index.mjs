/**
 * Representative runnable workflow prototype for Sample Scenario: "Field Inspection Checklist & Photo Report App"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "field-inspection-offline-form-app",
  title: "Field Inspection Checklist & Photo Report App",
  niche: "Custom Web Apps & B2B SaaS",
  status: "Sample Scenario",
  stages: ["Touch-friendly pass/fail/flag checklists","Local draft resilience on weak connections","Severity summary & corrective action list","Printable compliance summary view"],
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
