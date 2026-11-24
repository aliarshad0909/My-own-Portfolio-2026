import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diffOpenApiSpecs } from "./index.mjs";

describe("api-contract-diff", () => {
  it("distinguishes breaking removals from safe additive response fields", () => {
    const base = { paths: { "/v1/orders": { get: { requiredParams: [], responseFields: ["id", "total"] } } } };
    const safe = { paths: { "/v1/orders": { get: { requiredParams: [], responseFields: ["id", "total", "currency"] } } } };
    const bad = { paths: { "/v1/orders": { get: { requiredParams: ["orgId"], responseFields: ["id"] } } } };
    assert.equal(diffOpenApiSpecs(base, safe).hasBreakingChanges, false);
    assert.equal(diffOpenApiSpecs(base, bad).breaking.length, 2);
  });
});
