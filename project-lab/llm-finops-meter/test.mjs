import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attributeSpend, calculateEventCostMicroUsd } from "./index.mjs";

describe("llm-finops-meter", () => {
  it("computes cached vs uncached integer microdollar spend and triggers tenant alerts", () => {
    const rates = { m1: { inputPer1M: 1_000_000, cachedInputPer1M: 250_000, outputPer1M: 2_000_000 } };
    const c = calculateEventCostMicroUsd(rates, { model: "m1", inputTokens: 2000, cachedInputTokens: 1000, outputTokens: 500 });
    assert.equal(c, 2250);
    const out = attributeSpend(rates, [{ tenant: "t1", model: "m1", inputTokens: 2000, cachedInputTokens: 1000, outputTokens: 500 }], { t1: 2000 });
    assert.equal(out.alerts.length, 1);
  });
});
