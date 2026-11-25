import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconcileThreeWay } from "./index.mjs";

describe("invoice-three-way-match", () => {
  it("auto-approves within tolerance and holds short-shipped overbills", () => {
    const ok = reconcileThreeWay({ poLines: [{ sku: "X", qty: 10, unitPriceCents: 1000 }], receiptBySku: { X: 10 }, invoiceLines: [{ sku: "X", qty: 10, unitPriceCents: 1015 }] });
    assert.equal(ok.verdict, "auto_approve");
    const hold = reconcileThreeWay({ poLines: [{ sku: "X", qty: 10, unitPriceCents: 1000 }], receiptBySku: { X: 8 }, invoiceLines: [{ sku: "X", qty: 10, unitPriceCents: 1000 }] });
    assert.equal(hold.verdict, "hold_for_ap_review");
  });
});
