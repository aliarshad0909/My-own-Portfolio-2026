import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateReturnRma } from "./index.mjs";

describe("returns-margin-triage", () => {
  it("recommends keep-item when reverse logistics exceeds resale salvage value", () => {
    const lowVal = evaluateReturnRma({ priceCents: 1500, unitCostCents: 400, resaleValueCents: 700, returnShippingCents: 850, inspectRestockCents: 300, condition: "opened", wantsExchange: false });
    assert.equal(lowVal.action, "keep_item_refund_or_credit");
    const highVal = evaluateReturnRma({ priceCents: 12000, unitCostCents: 3500, resaleValueCents: 10000, returnShippingCents: 1000, inspectRestockCents: 500, condition: "sealed", wantsExchange: false });
    assert.equal(highVal.action, "return_and_restock");
  });
});
