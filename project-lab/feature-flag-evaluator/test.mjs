import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateFlag } from "./index.mjs";

describe("feature-flag-evaluator", () => {
  it("honors kill-switch and allowlist precedence and hashes deterministically", () => {
    assert.equal(evaluateFlag({ key: "f", killSwitch: true, allowUsers: ["u1"], rolloutPct: 100 }, { userId: "u1" }).enabled, false);
    assert.equal(evaluateFlag({ key: "f", allowUsers: ["u1"], rolloutPct: 0 }, { userId: "u1" }).enabled, true);
    const a = evaluateFlag({ key: "f", rolloutPct: 50 }, { userId: "user_99" });
    const b = evaluateFlag({ key: "f", rolloutPct: 50 }, { userId: "user_99" });
    assert.deepEqual(a, b);
  });
});
