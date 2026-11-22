import { and, eq, isNotNull } from "drizzle-orm";
import { getDb, type FlowOsDb } from "@/db";
import { runSteps, workflowRuns, workflows } from "@/db/schema";
import { validateSafeExternalUrl } from "@/lib/security";
import type {
  ConditionOperator,
  FlowEdge,
  FlowNode,
  FlowNodeConfig,
  PendingTraversalState,
  RunGraphSnapshot,
  RunStatus,
  StepStatus,
} from "@/lib/types";

export class ApprovalConflictError extends Error {
  readonly statusCode = 409;
  readonly code = "APPROVAL_CONFLICT";

  constructor(message = "Run is no longer awaiting approval.") {
    super(message);
    this.name = "ApprovalConflictError";
  }
}

export class RunNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = "RUN_NOT_FOUND";

  constructor(message = "Workflow run not found.") {
    super(message);
    this.name = "RunNotFoundError";
  }
}

export type ExecutionContext = {
  payload: Record<string, unknown>;
  ai?: Record<string, unknown>;
  transform?: Record<string, unknown>;
  steps: Record<string, Record<string, unknown>>;
  meta: {
    workflowId: string;
    workflowName: string;
    runId: string;
    retryCount: number;
    approvalGranted?: boolean;
    approvedBy?: string;
  };
  traversal?: PendingTraversalState;
};

function createGraphSnapshot(wf: {
  id: string;
  name: string;
  updatedAt?: Date | string | null;
  nodesJson: FlowNode[] | null;
  edgesJson: FlowEdge[] | null;
}): RunGraphSnapshot {
  const nodes = structuredClone((wf.nodesJson || []) as FlowNode[]);
  const edges = structuredClone((wf.edgesJson || []) as FlowEdge[]);
  const workflowUpdatedAt =
    wf.updatedAt instanceof Date
      ? wf.updatedAt.toISOString()
      : typeof wf.updatedAt === "string"
        ? wf.updatedAt
        : null;

  return {
    workflowId: wf.id,
    workflowName: wf.name,
    workflowUpdatedAt,
    nodes,
    edges,
  };
}

export function getByPath(source: Record<string, unknown>, dotPath: string): unknown {
  if (!dotPath) return undefined;
  const parts = dotPath.split(".").map((p) => p.trim()).filter(Boolean);
  let current: unknown = source;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function resolveTemplate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawPath: string) => {
    const val = getByPath(ctx, rawPath);
    if (val === undefined || val === null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  });
}

export function evaluateCondition(
  ctx: Record<string, unknown>,
  field: string,
  operator: ConditionOperator,
  expected: string | number | boolean | undefined,
): { passed: boolean; actual: unknown; expected: unknown; expression: string } {
  const actual = getByPath(ctx, field);
  const numActual = typeof actual === "number" ? actual : Number(actual);
  const numExpected = typeof expected === "number" ? expected : Number(expected);
  const bothNumeric =
    actual !== "" &&
    actual !== null &&
    actual !== undefined &&
    expected !== "" &&
    expected !== null &&
    expected !== undefined &&
    !Number.isNaN(numActual) &&
    !Number.isNaN(numExpected);

  let passed = false;
  switch (operator) {
    case ">":
      passed = bothNumeric ? numActual > numExpected : false;
      break;
    case ">=":
      passed = bothNumeric ? numActual >= numExpected : false;
      break;
    case "<":
      passed = bothNumeric ? numActual < numExpected : false;
      break;
    case "<=":
      passed = bothNumeric ? numActual <= numExpected : false;
      break;
    case "===":
      passed = bothNumeric ? numActual === numExpected : String(actual) === String(expected);
      break;
    case "!==":
      passed = bothNumeric ? numActual !== numExpected : String(actual) !== String(expected);
      break;
    case "contains":
      passed = String(actual ?? "")
        .toLowerCase()
        .includes(String(expected ?? "").toLowerCase());
      break;
    case "exists":
      passed = actual !== undefined && actual !== null && String(actual).trim() !== "";
      break;
    default:
      passed = false;
  }

  return {
    passed,
    actual: actual ?? null,
    expected: expected ?? null,
    expression: `${field} ${operator} ${String(expected ?? "")}`,
  };
}

export function applyTransform(
  ctx: Record<string, unknown>,
  config: FlowNodeConfig,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  if (config.mappings && typeof config.mappings === "object") {
    for (const [targetKey, sourcePath] of Object.entries(config.mappings)) {
      if (sourcePath.includes("{{")) {
        mapped[targetKey] = resolveTemplate(sourcePath, ctx);
      } else {
        mapped[targetKey] = getByPath(ctx, sourcePath) ?? null;
      }
    }
  }
  if (config.template) {
    mapped.summary = resolveTemplate(config.template, ctx);
  }
  return mapped;
}

export function runDeterministicAi(
  payload: Record<string, unknown>,
  config: FlowNodeConfig,
): Record<string, unknown> {
  const task = config.task || "custom";
  const textBlob = JSON.stringify(payload).toLowerCase();

  if (task === "lead_scoring") {
    const budget = Number(payload.budgetUsd ?? payload.budget ?? 0);
    const employees = Number(payload.employees ?? payload.companySize ?? 0);
    let score = 45;
    if (budget >= 25_000) score += 28;
    else if (budget >= 10_000) score += 16;
    if (employees >= 100) score += 15;
    else if (employees >= 25) score += 8;
    if (textBlob.includes("audit") || textBlob.includes("enterprise") || textBlob.includes("approval")) {
      score += 8;
    }
    score = Math.min(98, Math.max(12, score));
    const tier = score >= 80 ? "Enterprise Tier-1" : score >= 70 ? "Qualified Priority" : "Nurture";
    const leadName = String(payload.leadName || payload.name || "there");
    const company = String(payload.company || "your team");

    return {
      engineMode: "deterministic",
      task,
      score,
      tier,
      priority: score >= 70 ? "high" : "standard",
      sentiment: "positive",
      recommendedAction:
        score >= 70 ? "Queue for AE approval and send tailored walkthrough" : "Add to nurture sequence",
      draftMessage: `Hi ${leadName}, thanks for reaching out from ${company}. We reviewed your automation goals and prepared a FlowOS sandbox with human-in-the-loop approval gates tailored for your team. Would Thursday at 10:00 UTC work for a 20-minute architecture review?`,
    };
  }

  if (task === "ticket_triage") {
    const urgentTerms = ["urgent", "502", "outage", "down", "production", "timeout", "spike", "security"];
    const matches = urgentTerms.filter((w) => textBlob.includes(w));
    const isEnterprise = String(payload.plan || "").toLowerCase().includes("enterprise");
    const score = Math.min(99, 50 + matches.length * 14 + (isEnterprise ? 12 : 0));
    const priority = score >= 80 ? "P1 - Critical" : score >= 65 ? "P2 - High" : "P3 - Normal";
    const customer = String(payload.customer || "Customer");
    const ticketId = String(payload.ticketId || "TICKET");

    return {
      engineMode: "deterministic",
      task,
      score,
      priority,
      sentiment: matches.length >= 2 ? "urgent_concerned" : "neutral",
      tags: matches.length > 0 ? matches : ["general_support"],
      recommendedAction: "Escalate to on-call engineer after support lead approves draft reply",
      draftMessage: `Hello ${customer} team, we received ${ticketId} and prioritized it as ${priority}. Our platform team is checking TLS/webhook telemetry now and will share a verified root-cause update within 20 minutes.`,
    };
  }

  if (task === "invoice_escalation") {
    const days = Number(payload.daysOverdue ?? 0);
    const amount = Number(payload.amountUsd ?? 0);
    const score = Math.min(99, 40 + Math.min(35, days * 1.5) + (amount >= 10_000 ? 20 : 8));
    const priority = days >= 30 ? "High Escalation" : days >= 15 ? "Controller Review" : "Soft Reminder";
    const invoiceNumber = String(payload.invoiceNumber || "INV-PENDING");
    const accountName = String(payload.accountName || "Valued Client");

    return {
      engineMode: "deterministic",
      task,
      score: Math.round(score),
      priority,
      sentiment: "formal",
      recommendedAction: "Controller verifies remittance before dispatching escalation email",
      draftMessage: `Dear ${accountName} Accounts Payable, this is a formal reminder that invoice ${invoiceNumber} ($${amount.toLocaleString("en-US")}) is currently ${days} days past due. Please confirm payment scheduling or share remittance details so we can update your account.`,
    };
  }

  if (task === "inventory_analysis") {
    const stockQty = Number(payload.stockQty ?? 0);
    const reorderPoint = Number(payload.reorderPoint ?? 25);
    const deficit = Math.max(0, reorderPoint - stockQty);
    const suggestedOrderQty = Math.max(25, Math.ceil((reorderPoint * 2 - stockQty) / 5) * 5);
    const priority = stockQty <= reorderPoint * 0.5 ? "Urgent Replenishment" : "Standard Reorder";
    const sku = String(payload.sku || "SKU-UNKNOWN");
    const productName = String(payload.productName || "Item");

    return {
      engineMode: "deterministic",
      task,
      score: Math.min(98, 60 + deficit * 2),
      priority,
      suggestedOrderQty,
      estimatedCostUsd: suggestedOrderQty * Number(payload.unitCostUsd ?? 50),
      recommendedAction: `Issue PO for ${suggestedOrderQty} units of ${sku} after procurement sign-off`,
      draftMessage: `Procurement Request: ${sku} (${productName}) is at ${stockQty} units (threshold ${reorderPoint}). Recommend immediate reorder of ${suggestedOrderQty} units to avoid stockout.`,
    };
  }

  // Generic deterministic AI enrichment
  const keys = Object.keys(payload);
  return {
    engineMode: "deterministic",
    task: "custom",
    score: 78,
    priority: "standard",
    sentiment: "neutral",
    detectedFields: keys,
    recommendedAction: "Review structured draft and proceed",
    draftMessage: `FlowOS Deterministic Summary: Processed ${keys.length} input field(s) (${keys.slice(0, 5).join(", ") || "none"}) under prompt "${config.systemPrompt || "Default analysis"}".`,
  };
}

function findEntryNode(nodes: FlowNode[], edges: FlowEdge[]): FlowNode | undefined {
  const triggerTypes = new Set(["trigger", "schedule", "webhook"]);
  const explicitTrigger = nodes.find((n) => triggerTypes.has(n.data.nodeType));
  if (explicitTrigger) return explicitTrigger;
  const targets = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targets.has(n.id)) ?? nodes[0];
}

function findNextEdges(
  node: FlowNode,
  edges: FlowEdge[],
  branchResult?: boolean,
): FlowEdge[] {
  const outgoing = edges.filter((e) => e.source === node.id);
  if (node.data.nodeType !== "condition" || branchResult === undefined) {
    return outgoing;
  }
  const want = branchResult ? "true" : "false";
  const matched = outgoing.filter((e) => {
    const handle = (e.sourceHandle || "").toLowerCase();
    const label = (e.label || "").toLowerCase();
    return handle === want || label === want;
  });
  return matched;
}

async function runGraphFromNodes(params: {
  db: FlowOsDb;
  runId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodes: FlowNode[];
  initialVisitedIds?: Iterable<string>;
  context: ExecutionContext;
  startingStepOrder: number;
  initialDurationMs: number;
}): Promise<{
  status: RunStatus;
  pausedNodeId: string | null;
  approvalPrompt: string | null;
  outputJson: Record<string, unknown>;
  errorMessage: string | null;
  durationMs: number;
}> {
  const { db, runId, nodes, edges, context } = params;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>(params.initialVisitedIds ?? []);
  const queue: FlowNode[] = [];
  const queuedIds = new Set<string>();

  const enqueue = (candidate: FlowNode | undefined) => {
    if (!candidate) return;
    if (visited.has(candidate.id) || queuedIds.has(candidate.id)) return;
    queuedIds.add(candidate.id);
    queue.push(candidate);
  };

  for (const startNode of params.startNodes) {
    enqueue(startNode);
  }

  let stepOrder = params.startingStepOrder;
  let totalDuration = params.initialDurationMs;
  let lastOutput: Record<string, unknown> = context.transform || context.ai || context.payload;

  while (queue.length > 0) {
    const node = queue.shift()!;
    queuedIds.delete(node.id);
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    stepOrder += 1;

    const stepStart = Date.now();
    const cfg = node.data.config || {};
    const nodeType = node.data.nodeType;
    const stepInput: Record<string, unknown> = {
      payload: context.payload,
      ai: context.ai ?? null,
      transform: context.transform ?? null,
    };

    try {
      let stepOutput: Record<string, unknown> = {};
      let branchResult: boolean | undefined;

      if (nodeType === "trigger") {
        stepOutput = {
          eventName: cfg.eventName || "manual.trigger",
          receivedAt: new Date().toISOString(),
          payloadKeys: Object.keys(context.payload),
        };
      } else if (nodeType === "schedule") {
        stepOutput = {
          cron: cfg.cron || "0 * * * *",
          timezone: cfg.timezone || "UTC",
          scheduledAt: new Date().toISOString(),
          payloadKeys: Object.keys(context.payload),
        };
      } else if (nodeType === "webhook") {
        stepOutput = {
          webhookPath: cfg.webhookPath || "/hooks/inbound",
          signatureVerified: true,
          receivedAt: new Date().toISOString(),
          payloadKeys: Object.keys(context.payload),
        };
      } else if (nodeType === "condition") {
        const evalRes = evaluateCondition(
          context as unknown as Record<string, unknown>,
          cfg.field || "payload.score",
          cfg.operator || ">=",
          cfg.value,
        );
        branchResult = evalRes.passed;
        stepOutput = {
          ...evalRes,
          branchTaken: evalRes.passed ? "true" : "false",
        };
      } else if (nodeType === "transform") {
        const transformed = applyTransform(context as unknown as Record<string, unknown>, cfg);
        context.transform = { ...(context.transform || {}), ...transformed };
        stepOutput = transformed;
      } else if (nodeType === "ai_process") {
        const aiResult = runDeterministicAi(context.payload, cfg);
        context.ai = aiResult;
        stepOutput = aiResult;
      } else if (nodeType === "human_approval") {
        // MANDATORY SAFETY GATE: pause execution until an authorized operator clicks Approve & Resume or Reject.
        const prompt =
          cfg.approvalPrompt ||
          "Operator review required before executing downstream external actions.";
        const durationMs = Math.max(4, Date.now() - stepStart + 8);
        totalDuration += durationMs;

        const approvalOutgoingNodeIds = findNextEdges(node, edges)
          .map((e) => e.target)
          .filter(
            (targetId, idx, arr) =>
              nodeMap.has(targetId) &&
              !visited.has(targetId) &&
              arr.indexOf(targetId) === idx,
          );
        const remainingQueuedNodeIds = queue
          .map((queuedNode) => queuedNode.id)
          .filter((id) => !visited.has(id));

        context.traversal = {
          pausedNodeId: node.id,
          approvalOutgoingNodeIds,
          queuedNodeIds: remainingQueuedNodeIds,
          visitedNodeIds: Array.from(visited),
        };

        const gateOutput = {
          gateStatus: "awaiting_approval",
          approvalPrompt: prompt,
          approverRole: cfg.approverRole || "Operations Lead",
          channelPreview: cfg.channelPreview || "External Action",
          draftPreview:
            context.transform?.draftBody ||
            context.transform?.replyDraft ||
            context.transform?.noticeDraft ||
            context.transform?.draftPo ||
            context.ai?.draftMessage ||
            context.transform?.summary ||
            JSON.stringify(context.payload),
          safetyPolicy: "External dispatch blocked until explicit human approval.",
        };

        await db.insert(runSteps).values({
          runId,
          stepOrder,
          nodeId: node.id,
          nodeType,
          label: node.data.label,
          status: "awaiting_approval" satisfies StepStatus,
          inputJson: stepInput,
          outputJson: gateOutput,
          durationMs,
        });

        await db
          .update(workflowRuns)
          .set({
            status: "awaiting_approval" satisfies RunStatus,
            pausedNodeId: node.id,
            approvalPrompt: prompt,
            contextJson: context as unknown as Record<string, unknown>,
            outputJson: gateOutput,
            durationMs: totalDuration,
            errorMessage: null,
          })
          .where(eq(workflowRuns.id, runId));

        return {
          status: "awaiting_approval",
          pausedNodeId: node.id,
          approvalPrompt: prompt,
          outputJson: gateOutput,
          errorMessage: null,
          durationMs: totalDuration,
        };
      } else if (nodeType === "http_request") {
        const targetUrl = cfg.url || "https://hooks.flowos.studio/sandbox/dispatch";
        const urlCheck = validateSafeExternalUrl(targetUrl);
        if (!urlCheck.valid) {
          throw new Error(`Blocked HTTP target URL: ${urlCheck.reason}`);
        }
        const shouldFail =
          Boolean(cfg.simulateFailure) || Boolean(context.payload._simulateHttpFailure);
        if (shouldFail) {
          throw new Error(
            `Simulated downstream 503 Service Unavailable from ${targetUrl} (ready for operator retry).`,
          );
        }

        const body = cfg.bodyTemplate
          ? resolveTemplate(cfg.bodyTemplate, context as unknown as Record<string, unknown>)
          : {
              workflow: context.meta.workflowName,
              runId,
              approvedBy: context.meta.approvedBy || "sandbox-only",
              data: context.transform || context.ai || context.payload,
            };

        stepOutput = {
          mode: "sandbox_dry_run",
          dispatchedExternalTraffic: false,
          method: cfg.method || "POST",
          url: targetUrl,
          integrationKind: cfg.integrationKind || "http",
          httpStatus: 200,
          approvalVerified: Boolean(context.meta.approvalGranted),
          requestPreview: body,
          responsePreview: {
            ok: true,
            deliveryId: `snd_${runId.slice(0, 8)}`,
            receivedAt: new Date().toISOString(),
          },
        };
      }

      const durationMs = Math.max(3, Date.now() - stepStart + 12);
      totalDuration += durationMs;
      context.steps[node.id] = stepOutput;
      lastOutput = stepOutput;

      await db.insert(runSteps).values({
        runId,
        stepOrder,
        nodeId: node.id,
        nodeType,
        label: node.data.label,
        status: "completed" satisfies StepStatus,
        inputJson: stepInput,
        outputJson: stepOutput,
        durationMs,
      });

      const nextEdges = findNextEdges(node, edges, branchResult);
      for (const edge of nextEdges) {
        enqueue(nodeMap.get(edge.target));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Node execution failed";
      const durationMs = Math.max(5, Date.now() - stepStart + 10);
      totalDuration += durationMs;
      delete context.traversal;

      await db.insert(runSteps).values({
        runId,
        stepOrder,
        nodeId: node.id,
        nodeType,
        label: node.data.label,
        status: "failed" satisfies StepStatus,
        inputJson: stepInput,
        outputJson: { error: errorMessage },
        durationMs,
        errorMessage,
      });

      await db
        .update(workflowRuns)
        .set({
          status: "failed" satisfies RunStatus,
          pausedNodeId: null,
          contextJson: context as unknown as Record<string, unknown>,
          outputJson: { error: errorMessage, failedNodeId: node.id },
          durationMs: totalDuration,
          errorMessage,
          completedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));

      return {
        status: "failed",
        pausedNodeId: null,
        approvalPrompt: null,
        outputJson: { error: errorMessage, failedNodeId: node.id },
        errorMessage,
        durationMs: totalDuration,
      };
    }
  }

  delete context.traversal;

  await db
    .update(workflowRuns)
    .set({
      status: "completed" satisfies RunStatus,
      pausedNodeId: null,
      contextJson: context as unknown as Record<string, unknown>,
      outputJson: lastOutput,
      durationMs: totalDuration,
      errorMessage: null,
      completedAt: new Date(),
    })
    .where(eq(workflowRuns.id, runId));

  return {
    status: "completed",
    pausedNodeId: null,
    approvalPrompt: null,
    outputJson: lastOutput,
    errorMessage: null,
    durationMs: totalDuration,
  };
}

export async function executeWorkflow(
  workflowId: string,
  triggerPayload: Record<string, unknown> = {},
  options?: { db?: FlowOsDb; triggerType?: string },
) {
  const db = options?.db ?? (await getDb());
  const wfRows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);
  const wf = wfRows[0];
  if (!wf) {
    throw new Error("Workflow not found.");
  }

  const payload =
    Object.keys(triggerPayload).length > 0
      ? triggerPayload
      : (wf.samplePayload as Record<string, unknown>) || {};

  const graphSnapshot = createGraphSnapshot(wf);

  const [createdRun] = await db
    .insert(workflowRuns)
    .values({
      workflowId: wf.id,
      workflowName: wf.name,
      status: "running" satisfies RunStatus,
      triggerType: options?.triggerType || wf.triggerType,
      triggerPayload: payload,
      contextJson: {},
      graphSnapshotJson: graphSnapshot,
      outputJson: {},
      retryCount: 0,
      durationMs: 0,
    })
    .returning();

  const context: ExecutionContext = {
    payload,
    steps: {},
    meta: {
      workflowId: wf.id,
      workflowName: wf.name,
      runId: createdRun.id,
      retryCount: 0,
    },
  };

  const startNode = findEntryNode(graphSnapshot.nodes, graphSnapshot.edges);

  const result = await runGraphFromNodes({
    db,
    runId: createdRun.id,
    nodes: graphSnapshot.nodes,
    edges: graphSnapshot.edges,
    startNodes: startNode ? [startNode] : [],
    context,
    startingStepOrder: 0,
    initialDurationMs: 0,
  });

  const [updatedRun] = await db
    .select()
    .from(workflowRuns)
    .where(eq(workflowRuns.id, createdRun.id))
    .limit(1);
  const steps = await db
    .select()
    .from(runSteps)
    .where(eq(runSteps.runId, createdRun.id));

  return {
    run: updatedRun,
    steps: steps.sort((a, b) => a.stepOrder - b.stepOrder),
    result,
  };
}

export async function resolveApproval(
  runId: string,
  decision: "approve" | "reject",
  actorName: string,
  note?: string,
  options?: { db?: FlowOsDb },
) {
  const db = options?.db ?? (await getDb());

  const rejectionOutput =
    decision === "reject"
      ? {
          gateStatus: "rejected",
          rejectedBy: actorName,
          note: note || "Rejected by operator at human approval gate.",
          externalDispatchBlocked: true,
          decidedAt: new Date().toISOString(),
        }
      : null;

  // Atomically claim the awaiting_approval run BEFORE modifying steps or executing downstream nodes.
  // Only one concurrent caller can win this conditional transition; all other callers get a 409 conflict.
  const [claimedRun] = await db
    .update(workflowRuns)
    .set(
      decision === "reject"
        ? {
            status: "rejected" satisfies RunStatus,
            approvedBy: actorName,
            approvalNote: note || "Rejected at human approval gate.",
            outputJson: rejectionOutput!,
            completedAt: new Date(),
          }
        : {
            status: "running" satisfies RunStatus,
            approvedBy: actorName,
            approvalNote: note || "Approved by operator.",
          },
    )
    .where(
      and(
        eq(workflowRuns.id, runId),
        eq(workflowRuns.status, "awaiting_approval"),
        isNotNull(workflowRuns.pausedNodeId),
      ),
    )
    .returning();

  if (!claimedRun || !claimedRun.pausedNodeId) {
    const existingRows = await db
      .select({ id: workflowRuns.id })
      .from(workflowRuns)
      .where(eq(workflowRuns.id, runId))
      .limit(1);
    if (existingRows.length === 0) {
      throw new RunNotFoundError("Workflow run not found.");
    }
    throw new ApprovalConflictError("Run is no longer awaiting approval.");
  }

  const pausedNodeId = claimedRun.pausedNodeId;

  const existingSteps = await db
    .select()
    .from(runSteps)
    .where(eq(runSteps.runId, runId));
  const sortedSteps = existingSteps.sort((a, b) => a.stepOrder - b.stepOrder);
  const pausedStep = [...sortedSteps]
    .reverse()
    .find((s) => s.nodeId === pausedNodeId && s.status === "awaiting_approval");

  if (decision === "reject") {
    if (pausedStep) {
      await db
        .update(runSteps)
        .set({
          status: "rejected" satisfies StepStatus,
          outputJson: {
            ...(pausedStep.outputJson as Record<string, unknown>),
            ...rejectionOutput!,
          },
          errorMessage: note || "Rejected by operator.",
        })
        .where(eq(runSteps.id, pausedStep.id));
    }

    const cleanedContext = { ...((claimedRun.contextJson || {}) as Record<string, unknown>) };
    delete cleanedContext.traversal;

    await db
      .update(workflowRuns)
      .set({
        pausedNodeId: null,
        contextJson: cleanedContext,
      })
      .where(eq(workflowRuns.id, runId));

    const [finalRun] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, runId)).limit(1);
    const steps = (await db.select().from(runSteps).where(eq(runSteps.runId, runId))).sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );
    return { run: finalRun, steps };
  }

  // Decision === "approve": always resume against the run's original snapshotted graph (falling back only for legacy rows)
  let nodes: FlowNode[];
  let edges: FlowEdge[];
  let workflowName = claimedRun.workflowName;

  const snapshot = claimedRun.graphSnapshotJson;
  if (snapshot && Array.isArray(snapshot.nodes) && Array.isArray(snapshot.edges)) {
    nodes = structuredClone(snapshot.nodes);
    edges = structuredClone(snapshot.edges);
    workflowName = snapshot.workflowName || workflowName;
  } else {
    const wfRows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, claimedRun.workflowId))
      .limit(1);
    const wf = wfRows[0];
    if (!wf) {
      await db
        .update(workflowRuns)
        .set({
          status: "failed" satisfies RunStatus,
          pausedNodeId: null,
          errorMessage: "Associated workflow no longer exists.",
          completedAt: new Date(),
        })
        .where(eq(workflowRuns.id, runId));
      throw new Error("Associated workflow no longer exists.");
    }
    nodes = structuredClone((wf.nodesJson || []) as FlowNode[]);
    edges = structuredClone((wf.edgesJson || []) as FlowEdge[]);
    workflowName = wf.name;
  }

  const approvalOutput = {
    gateStatus: "approved",
    approvedBy: actorName,
    note: note || "Approved for downstream execution.",
    decidedAt: new Date().toISOString(),
  };

  if (pausedStep) {
    await db
      .update(runSteps)
      .set({
        status: "completed" satisfies StepStatus,
        outputJson: {
          ...(pausedStep.outputJson as Record<string, unknown>),
          ...approvalOutput,
        },
      })
      .where(eq(runSteps.id, pausedStep.id));
  }

  const savedContext = (claimedRun.contextJson || {}) as unknown as ExecutionContext;
  const savedTraversal =
    savedContext.traversal && savedContext.traversal.pausedNodeId === pausedNodeId
      ? savedContext.traversal
      : undefined;

  const context: ExecutionContext = {
    payload: savedContext.payload || (claimedRun.triggerPayload as Record<string, unknown>) || {},
    ai: savedContext.ai,
    transform: savedContext.transform,
    steps: {
      ...(savedContext.steps || {}),
      [pausedNodeId]: approvalOutput,
    },
    meta: {
      workflowId: claimedRun.workflowId,
      workflowName,
      runId: claimedRun.id,
      retryCount: claimedRun.retryCount,
      approvalGranted: true,
      approvedBy: actorName,
    },
  };

  await db
    .update(workflowRuns)
    .set({
      pausedNodeId: null,
      contextJson: context as unknown as Record<string, unknown>,
    })
    .where(eq(workflowRuns.id, runId));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visitedIds = new Set<string>([pausedNodeId]);
  if (savedTraversal) {
    for (const id of savedTraversal.visitedNodeIds) {
      visitedIds.add(id);
    }
  }
  for (const step of sortedSteps) {
    visitedIds.add(step.nodeId);
  }

  const approvalOutgoingNodeIds = savedTraversal
    ? savedTraversal.approvalOutgoingNodeIds
    : edges.filter((e) => e.source === pausedNodeId).map((e) => e.target);
  const remainingQueuedNodeIds = savedTraversal ? savedTraversal.queuedNodeIds : [];

  const resumeNodeIds: string[] = [];
  const seenResumeIds = new Set<string>();
  for (const candidateId of [...approvalOutgoingNodeIds, ...remainingQueuedNodeIds]) {
    if (visitedIds.has(candidateId) || seenResumeIds.has(candidateId)) continue;
    seenResumeIds.add(candidateId);
    resumeNodeIds.push(candidateId);
  }

  const resumeNodes = resumeNodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is FlowNode => Boolean(n));

  const maxStepOrder = sortedSteps.reduce((acc, s) => Math.max(acc, s.stepOrder), 0);

  await runGraphFromNodes({
    db,
    runId,
    nodes,
    edges,
    startNodes: resumeNodes,
    initialVisitedIds: visitedIds,
    context,
    startingStepOrder: maxStepOrder,
    initialDurationMs: claimedRun.durationMs,
  });

  const [finalRun] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, runId)).limit(1);
  const steps = (await db.select().from(runSteps).where(eq(runSteps.runId, runId))).sort(
    (a, b) => a.stepOrder - b.stepOrder,
  );
  return { run: finalRun, steps };
}

export async function retryWorkflowRun(
  runId: string,
  options?: { db?: FlowOsDb; clearSimulatedFailure?: boolean },
) {
  const db = options?.db ?? (await getDb());
  const runRows = await db
    .select()
    .from(workflowRuns)
    .where(eq(workflowRuns.id, runId))
    .limit(1);
  const run = runRows[0];
  if (!run) throw new RunNotFoundError("Workflow run not found.");
  if (run.status !== "failed") {
    throw new Error("Only failed workflow runs can be retried.");
  }

  const wfRows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, run.workflowId))
    .limit(1);
  const wf = wfRows[0];
  if (!wf) throw new Error("Associated workflow not found.");

  const nextRetryCount = run.retryCount + 1;
  const cleanedPayload = { ...(run.triggerPayload as Record<string, unknown>) };
  if (options?.clearSimulatedFailure !== false) {
    delete cleanedPayload._simulateHttpFailure;
  }

  const graphSnapshot = createGraphSnapshot(wf);

  const [claimedRetry] = await db
    .update(workflowRuns)
    .set({
      status: "running" satisfies RunStatus,
      retryCount: nextRetryCount,
      triggerPayload: cleanedPayload,
      contextJson: {},
      graphSnapshotJson: graphSnapshot,
      errorMessage: null,
      pausedNodeId: null,
      completedAt: null,
      durationMs: 0,
    })
    .where(and(eq(workflowRuns.id, runId), eq(workflowRuns.status, "failed")))
    .returning();

  if (!claimedRetry) {
    throw new Error("Only failed workflow runs can be retried.");
  }

  // Clear previous attempt steps so the retried run shows a clean trace
  await db.delete(runSteps).where(eq(runSteps.runId, runId));

  const context: ExecutionContext = {
    payload: cleanedPayload,
    steps: {},
    meta: {
      workflowId: wf.id,
      workflowName: wf.name,
      runId: run.id,
      retryCount: nextRetryCount,
    },
  };

  const startNode = findEntryNode(graphSnapshot.nodes, graphSnapshot.edges);

  await runGraphFromNodes({
    db,
    runId: run.id,
    nodes: graphSnapshot.nodes,
    edges: graphSnapshot.edges,
    startNodes: startNode ? [startNode] : [],
    context,
    startingStepOrder: 0,
    initialDurationMs: 0,
  });

  const [finalRun] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, runId)).limit(1);
  const steps = (await db.select().from(runSteps).where(eq(runSteps.runId, runId))).sort(
    (a, b) => a.stepOrder - b.stepOrder,
  );
  return { run: finalRun, steps };
}
