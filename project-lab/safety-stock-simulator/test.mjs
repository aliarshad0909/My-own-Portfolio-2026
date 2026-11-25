import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateSafetyStock } from "./index.mjs";

describe("safety-stock-simulator", () => {
  it("produces deterministic monotonic quantiles (avg <= p95 <= p99)", () => {
    const res = simulateSafetyStock({ dailyMean: 20, dailyStd: 6, leadDaysMean: 10, leadDaysStd: 3, trials: 1000, seed: 7 });
    assert.ok(res.avgLeadDemand <= res.reorderPointP95);
    assert.ok(res.reorderPointP95 <= res.reorderPointP99);
  });
});
