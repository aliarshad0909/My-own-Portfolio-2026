import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyRagAnswer } from "./index.mjs";

describe("rag-citation-verifier", () => {
  it("passes grounded answers and catches hallucinated numbers", () => {
    const docs = { p1: "Standard shipping arrives in 5 business days for orders over 50 dollars." };
    assert.equal(verifyRagAnswer("Standard shipping arrives in 5 business days [p1].", docs).allGrounded, true);
    assert.equal(verifyRagAnswer("Standard shipping arrives in 2 business days [p1].", docs).allGrounded, false);
  });
});
