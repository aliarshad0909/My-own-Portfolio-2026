import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateGpuWorkload } from "./index.mjs";

describe("gpu-batch-cost-estimator", () => {
  it("distinguishes INT4 fit from FP16 OOM on 24GB VRAM", () => {
    assert.equal(estimateGpuWorkload({ paramsBillions: 14, bitsPerWeight: 4, vramGb: 24 }).fits, true);
    assert.equal(estimateGpuWorkload({ paramsBillions: 14, bitsPerWeight: 16, vramGb: 24 }).fits, false);
  });
});
