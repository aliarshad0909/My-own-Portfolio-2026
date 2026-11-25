import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditCssTokens, contrastRatio } from "./index.mjs";

describe("design-token-wcag-auditor", () => {
  it("computes exact WCAG 2.2 ratios from CSS variables", () => {
    assert.equal(contrastRatio("#ffffff", "#000000"), 21);
    const out = auditCssTokens(":root { --bg: #090c11; --text: #f8f5ef; --bad: #333333; }", [
      { fg: "--text", bg: "--bg", min: 7 },
      { fg: "--bad", bg: "--bg", min: 4.5 },
    ]);
    assert.equal(out.results[0].pass, true);
    assert.equal(out.results[1].pass, false);
  });
});
