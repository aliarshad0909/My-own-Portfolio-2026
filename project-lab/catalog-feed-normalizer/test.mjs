import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidEan13, normalizeCatalogFeed } from "./index.mjs";

describe("catalog-feed-normalizer", () => {
  it("validates EAN-13 checksums and quarantines duplicate or bad rows", () => {
    assert.equal(isValidEan13("4006381333931"), true);
    assert.equal(isValidEan13("4006381333932"), false);
    const out = normalizeCatalogFeed([
      { sku: "A1", title: "Valid Item", price: "$19.99", ean: "4006381333931" },
      { sku: "A1", title: "Dup Item", price: "$19.99" },
    ]);
    assert.equal(out.valid.length, 1);
    assert.equal(out.rejected.length, 1);
  });
});
