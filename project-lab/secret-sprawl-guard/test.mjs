import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scanTextForSecrets, shannonEntropy } from "./index.mjs";

describe("secret-sprawl-guard", () => {
  it("flags provider key shapes, calculates entropy, and honors inline ignore pragmas", () => {
    assert.ok(shannonEntropy("aB3dE9fG2hJ7kL4m") > 3.5);
    const hits = scanTextForSecrets("TOKEN=ghp_1234567890abcdefghij123456\nOK=ghp_1234567890abcdefghij123456 // secret-guard:ignore");
    assert.equal(hits.length, 1);
    assert.equal(hits[0].ruleId, "github-pat");
  });
});
