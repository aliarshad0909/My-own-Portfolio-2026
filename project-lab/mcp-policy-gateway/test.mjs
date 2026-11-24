import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateMcpCall } from "./index.mjs";

describe("mcp-policy-gateway", () => {
  const policy = {
    roles: { reader: { allowedTools: ["kb.search"] }, ops: { allowedTools: ["kb.search", "invoice.void"] } },
    tools: { "kb.search": { mutating: false, requiredArgs: ["query"] }, "invoice.void": { mutating: true, requiredArgs: ["id"] } },
  };
  it("enforces default-deny role allowlists and mandatory approval on mutating tools", () => {
    assert.equal(evaluateMcpCall(policy, { role: "reader", tool: "invoice.void", args: { id: "1" } }).allowed, false);
    const needApproval = evaluateMcpCall(policy, { role: "ops", tool: "invoice.void", args: { id: "1" } });
    assert.equal(needApproval.allowed, false);
    assert.equal(needApproval.requiresApproval, true);
    assert.equal(evaluateMcpCall(policy, { role: "ops", tool: "invoice.void", args: { id: "1" }, humanApprovalToken: "apr_ok" }).allowed, true);
  });
});
