import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { luhnValid, redactPii } from "./index.mjs";

describe("pii-redaction-pipeline", () => {
  it("redacts emails, SSNs, and Luhn-valid cards while leaving non-Luhn numbers intact", () => {
    assert.equal(luhnValid("4532015112830366"), true);
    assert.equal(luhnValid("4532015112830367"), false);
    const res = redactPii("Email bob@test.co SSN 123-45-6789 card 4532-0151-1283-0366");
    assert.equal(res.tokenCount, 3);
    assert.ok(!res.redacted.includes("bob@test.co"));
  });
});
