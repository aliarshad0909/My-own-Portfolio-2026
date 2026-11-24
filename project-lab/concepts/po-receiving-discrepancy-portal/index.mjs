/**
 * Representative runnable workflow prototype for Sample Scenario: "Warehouse Purchase-Order Receiving & Variance App"
 * Public portfolio page keeps this entry honestly labeled "Sample Scenario" — not a finished full-stack app.
 */
export const WORKFLOW_SPEC = {
  slug: "po-receiving-discrepancy-portal",
  title: "Warehouse Purchase-Order Receiving & Variance App",
  niche: "Inventory, Supply Chain & Sourcing",
  status: "Sample Scenario",
  stages: ["PO barcode lookup & line-by-line count","Automatic short/over variance flagging","Damaged-goods photo & claim memo export","Atomic inventory ledger posting"],
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
