import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateExperiment } from "./index.mjs";

describe("ab-experiment-guard", () => {
  it("invalidates experiments with sample-ratio mismatch and detects clean lifts", () => {
    assert.equal(evaluateExperiment({ controlN: 2500, controlConv: 250, variantN: 1800, variantConv: 240 }).status, "invalid_srm");
    assert.equal(evaluateExperiment({ controlN: 2000, controlConv: 200, variantN: 2010, variantConv: 265 }).status, "ship_variant");
  });
});
