import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WORKFLOW_SPEC, runRepresentativeWorkflow } from "./index.mjs";

describe("po-receiving-discrepancy-portal", () => {
  it("validates required inputs and runs all representative workflow stages cleanly", () => {
    assert.equal(runRepresentativeWorkflow({}).ok, false);
    const out = runRepresentativeWorkflow({ recordId: "SYN-42" });
    assert.equal(out.ok, true);
    assert.equal(out.stageCount, WORKFLOW_SPEC.stages.length);
    assert.ok(out.stageCount >= 3);
  });
});
