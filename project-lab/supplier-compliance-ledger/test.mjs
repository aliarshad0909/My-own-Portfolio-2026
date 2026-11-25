import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateSupplierCompliance } from "./index.mjs";

describe("supplier-compliance-ledger", () => {
  it("triggers ship hold when a mandatory certificate has expired", () => {
    const res = evaluateSupplierCompliance({ name: "Vendor X", certificates: [{ name: "ISO 9001", mandatory: true, expiresAt: "2026-10-01" }] }, "2026-11-24");
    assert.equal(res.shipHold, true);
    assert.ok(res.complianceScore < 60);
  });
});
