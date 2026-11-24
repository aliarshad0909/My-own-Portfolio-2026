import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runEvalSuite } from "./index.mjs";

describe("agent-eval-harness", () => {
  it("flags regressions when candidate fails a previously passing case", () => {
    const cases = [
      { id: "c1", requiredTerms: ["30 days"], forbiddenTerms: ["unlimited"], expectAbstain: false },
      { id: "c2", requiredTerms: [], forbiddenTerms: [], expectAbstain: true },
    ];
    const res = runEvalSuite(
      cases,
      { c1: { text: "Policy allows 30 days.", abstained: false }, c2: { text: "Escalating.", abstained: true } },
      { c1: { text: "Policy allows unlimited returns.", abstained: false }, c2: { text: "Escalating.", abstained: true } },
    );
    assert.deepEqual(res.regressions, ["c1"]);
    assert.equal(res.baseRate, 1);
    assert.equal(res.candRate, 0.5);
  });
});
