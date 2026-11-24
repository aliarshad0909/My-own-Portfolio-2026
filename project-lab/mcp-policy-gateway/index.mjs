export function evaluateMcpCall(policy, request) {
  const roleRules = policy.roles[request.role];
  if (!roleRules) return { allowed: false, reason: "unknown_role" };
  const toolSpec = policy.tools[request.tool];
  if (!toolSpec) return { allowed: false, reason: "unknown_tool" };
  if (!roleRules.allowedTools.includes(request.tool)) {
    return { allowed: false, reason: "tool_not_permitted_for_role" };
  }
  for (const key of toolSpec.requiredArgs || []) {
    if (request.args?.[key] === undefined || request.args?.[key] === "") {
      return { allowed: false, reason: `missing_arg:${key}` };
    }
  }
  if (toolSpec.mutating && !request.humanApprovalToken) {
    return { allowed: false, requiresApproval: true, reason: "human_approval_required" };
  }
  return { allowed: true, mode: toolSpec.mutating ? "approved_write" : "read_only" };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const policy = {
    roles: { support_agent: { allowedTools: ["kb.search", "order.refund"] } },
    tools: {
      "kb.search": { mutating: false, requiredArgs: ["query"] },
      "order.refund": { mutating: true, requiredArgs: ["orderId", "amountCents"] },
    },
  };
  console.log(JSON.stringify({
    readCheck: evaluateMcpCall(policy, { role: "support_agent", tool: "kb.search", args: { query: "shipping" } }),
    writeCheck: evaluateMcpCall(policy, { role: "support_agent", tool: "order.refund", args: { orderId: "ORD-9", amountCents: 2400 } }),
  }, null, 2));
}
