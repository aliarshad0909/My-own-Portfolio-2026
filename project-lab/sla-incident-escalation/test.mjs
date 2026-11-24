import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateSlaQueue } from "./index.mjs";

describe("sla-incident-escalation", () => {
  it("flags 75%+ burn as at_risk and 100%+ as breached", () => {
    const now = Date.parse("2026-11-24T12:00:00Z");
    const out = evaluateSlaQueue([
      { id: "a", priority: "P1", createdAt: "2026-11-24T11:36:00Z" },
      { id: "b", priority: "P1", createdAt: "2026-11-24T11:20:00Z" },
    ], now);
    assert.equal(out[0].id, "b");
    assert.equal(out[0].state, "breached");
    assert.equal(out[1].state, "at_risk");
  });
});
