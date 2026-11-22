import assert from "node:assert/strict";
import test from "node:test";
import { eq } from "drizzle-orm";

// Force isolated in-memory PGlite for deterministic DB tests
process.env.DATABASE_URL = "";
process.env.FLOWOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import { runSteps, workflowRuns, workflows } from "@/db/schema";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import {
  applyTransform,
  ApprovalConflictError,
  evaluateCondition,
  executeWorkflow,
  resolveApproval,
  retryWorkflowRun,
  runDeterministicAi,
  RunNotFoundError,
} from "@/lib/engine";
import { validateSafeExternalUrl } from "@/lib/security";
import type { FlowEdge, FlowNode } from "@/lib/types";

test("Pure engine helpers: condition evaluation, transform mapping, and deterministic AI", () => {
  const ctx = {
    payload: { company: "Vertex Cloud", budgetUsd: 48000, employees: 240, tag: "enterprise-ops" },
    ai: { score: 86, tier: "Enterprise Tier-1", draftMessage: "Hello Vertex team" },
  };

  assert.equal(evaluateCondition(ctx, "ai.score", ">=", 70).passed, true);
  assert.equal(evaluateCondition(ctx, "ai.score", "<", 70).passed, false);
  assert.equal(evaluateCondition(ctx, "payload.tag", "contains", "enterprise").passed, true);
  assert.equal(evaluateCondition(ctx, "payload.company", "exists", "").passed, true);

  const transformed = applyTransform(ctx, {
    mappings: {
      org: "payload.company",
      score: "ai.score",
      headline: "Lead: {{payload.company}} ({{ai.tier}})",
    },
    template: "{{payload.company}} scored {{ai.score}}",
  });
  assert.equal(transformed.org, "Vertex Cloud");
  assert.equal(transformed.score, 86);
  assert.equal(transformed.headline, "Lead: Vertex Cloud (Enterprise Tier-1)");
  assert.equal(transformed.summary, "Vertex Cloud scored 86");

  const aiOut = runDeterministicAi(
    {
      leadName: "Elena",
      company: "Vertex Cloud",
      budgetUsd: 48000,
      employees: 240,
      message: "Need enterprise approval gates",
    },
    { task: "lead_scoring" },
  );
  assert.equal(aiOut.engineMode, "deterministic");
  assert.ok(Number(aiOut.score) >= 70);
  assert.ok(String(aiOut.draftMessage).includes("Vertex Cloud"));
});

test("Security helpers: scrypt passwords, locked staff password, session secret guard, SSRF URL validator", () => {
  const hash = hashPassword("FlowDemo2026!");
  assert.equal(verifyPassword("FlowDemo2026!", hash), true);
  assert.equal(verifyPassword("wrong-pass", hash), false);

  const locked = generateLockedPassword();
  assert.equal(locked.length, 64);

  assert.ok(resolveSessionSecret().length >= 32);

  assert.equal(validateSafeExternalUrl("https://hooks.flowos.studio/sandbox/crm").valid, true);
  assert.equal(validateSafeExternalUrl("http://169.254.169.254/latest/meta-data").valid, false);
  assert.equal(validateSafeExternalUrl("http://127.0.0.1:8080/internal").valid, false);
  assert.equal(validateSafeExternalUrl("http://10.0.0.12/admin").valid, false);
});

test("PostgreSQL / PGlite engine: human approval pause -> approve & resume -> reject -> retry -> demo reset", async () => {
  const db = await getDb();
  const activeWfs = await db.select().from(workflows).where(eq(workflows.isTemplate, false));
  assert.ok(activeWfs.length >= 4, "Expected at least 4 seeded active workflows");

  const leadWf = activeWfs.find((w) => w.slug === "inbound-lead-qualification");
  assert.ok(leadWf, "Expected Inbound Lead Qualification workflow");

  // 1. High-scoring lead MUST pause at human_approval gate (never runs http_request prematurely)
  const pausedExec = await executeWorkflow(
    leadWf.id,
    {
      leadName: "Nadia Kim",
      company: "Orbit Robotics",
      employees: 180,
      budgetUsd: 55000,
      message: "Enterprise audit and approval automation",
    },
    { db },
  );
  assert.equal(pausedExec.run.status, "awaiting_approval");
  assert.equal(pausedExec.run.pausedNodeId, "n-approval");
  assert.equal(
    pausedExec.steps.some((s) => s.nodeType === "http_request"),
    false,
    "HTTP dispatch must NOT execute before human approval",
  );

  // 2. Approve & Resume -> completes downstream HTTP dispatch
  const approved = await resolveApproval(
    pausedExec.run.id,
    "approve",
    "Aria Vance (Demo Ops)",
    "Verified lead fit.",
    { db },
  );
  assert.equal(approved.run.status, "completed");
  assert.equal(approved.run.approvedBy, "Aria Vance (Demo Ops)");
  assert.equal(
    approved.steps.some((s) => s.nodeType === "http_request" && s.status === "completed"),
    true,
    "HTTP dispatch should complete after approval",
  );

  // 3. Reject path -> blocks downstream HTTP dispatch permanently
  const rejectCandidate = await executeWorkflow(
    leadWf.id,
    {
      leadName: "Test Reject",
      company: "HoldCo",
      employees: 200,
      budgetUsd: 40000,
    },
    { db },
  );
  assert.equal(rejectCandidate.run.status, "awaiting_approval");
  const rejected = await resolveApproval(
    rejectCandidate.run.id,
    "reject",
    "Aria Vance (Demo Ops)",
    "Do not contact.",
    { db },
  );
  assert.equal(rejected.run.status, "rejected");
  assert.equal(
    rejected.steps.some((s) => s.nodeType === "http_request"),
    false,
    "Rejected run must never execute downstream HTTP dispatch",
  );

  // 4. Failed run -> Retry recovers cleanly & increments retryCount
  const failRun = await executeWorkflow(
    leadWf.id,
    {
      leadName: "Retry Prospect",
      company: "Nova Biotech",
      employees: 160,
      budgetUsd: 50000,
      _simulateHttpFailure: true,
    },
    { db },
  );
  const failedAfterApproval = await resolveApproval(
    failRun.run.id,
    "approve",
    "Aria Vance (Demo Ops)",
    "Proceeding with simulated transient 503.",
    { db },
  );
  assert.equal(failedAfterApproval.run.status, "failed");

  const retried = await retryWorkflowRun(failRun.run.id, { db });
  assert.equal(retried.run.retryCount, 1);
  assert.equal(retried.run.status, "awaiting_approval");
  const retriedCompleted = await resolveApproval(
    retried.run.id,
    "approve",
    "Aria Vance (Demo Ops)",
    "Approved after transient recovery.",
    { db },
  );
  assert.equal(retriedCompleted.run.status, "completed");

  // 5. Demo Reset restores clean baseline
  await resetDemoWorkspace();
  const afterResetWfs = await db.select().from(workflows).where(eq(workflows.isTemplate, false));
  const afterResetRuns = await db.select().from(workflowRuns);
  const afterResetSteps = await db.select().from(runSteps);
  assert.equal(afterResetWfs.length, 4);
  assert.ok(afterResetRuns.length >= 5);
  assert.ok(afterResetSteps.length >= 15);
});

test("Regression #1: approval resumption executes ALL outgoing branches, restores queued parallel branches, avoids duplicates, and handles nested approvals", async () => {
  const db = await getDb();

  const nodes: FlowNode[] = [
    {
      id: "n-trigger",
      type: "flowNode",
      position: { x: 0, y: 0 },
      data: { label: "Start", nodeType: "trigger", config: { eventName: "branch.test" } },
    },
    {
      id: "n-approval-1",
      type: "flowNode",
      position: { x: 200, y: 0 },
      data: {
        label: "Primary Approval Gate",
        nodeType: "human_approval",
        config: { approvalPrompt: "Approve primary fan-out" },
      },
    },
    {
      id: "n-parallel-queued",
      type: "flowNode",
      position: { x: 200, y: 200 },
      data: {
        label: "Parallel Queued Transform",
        nodeType: "transform",
        config: { mappings: { parallelTag: "payload.tag" } },
      },
    },
    {
      id: "n-parallel-http",
      type: "flowNode",
      position: { x: 400, y: 200 },
      data: {
        label: "Parallel Downstream Dispatch",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/parallel",
          bodyTemplate: "PARALLEL:{{payload.tag}}",
        },
      },
    },
    {
      id: "n-branch-a",
      type: "flowNode",
      position: { x: 400, y: -100 },
      data: {
        label: "Approval Outgoing Branch A",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/branch-a",
          bodyTemplate: "BRANCH_A:{{payload.tag}}",
        },
      },
    },
    {
      id: "n-branch-b",
      type: "flowNode",
      position: { x: 400, y: 50 },
      data: {
        label: "Approval Outgoing Branch B",
        nodeType: "transform",
        config: { mappings: { branchBReady: "payload.tag" } },
      },
    },
    {
      id: "n-approval-2",
      type: "flowNode",
      position: { x: 600, y: 50 },
      data: {
        label: "Nested Approval Gate",
        nodeType: "human_approval",
        config: { approvalPrompt: "Approve secondary release" },
      },
    },
    {
      id: "n-branch-b-final",
      type: "flowNode",
      position: { x: 800, y: 50 },
      data: {
        label: "Secondary Branch Dispatch",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/branch-b-final",
          bodyTemplate: "BRANCH_B_FINAL:{{payload.tag}}",
        },
      },
    },
    {
      id: "n-merge",
      type: "flowNode",
      position: { x: 1000, y: 0 },
      data: {
        label: "Shared Merge Audit",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/merge",
          bodyTemplate: "MERGED:{{payload.tag}}",
        },
      },
    },
  ];

  const edges: FlowEdge[] = [
    // Trigger fans out to BOTH approval gate and an already-queued parallel branch
    { id: "e-1", source: "n-trigger", target: "n-approval-1" },
    { id: "e-2", source: "n-trigger", target: "n-parallel-queued" },
    { id: "e-3", source: "n-parallel-queued", target: "n-parallel-http" },
    // Approval gate fans out to 2 outgoing branches (Branch A + Branch B)
    { id: "e-4", source: "n-approval-1", target: "n-branch-a" },
    { id: "e-5", source: "n-approval-1", target: "n-branch-b" },
    // Branch B hits a nested second approval gate
    { id: "e-6", source: "n-branch-b", target: "n-approval-2" },
    { id: "e-7", source: "n-approval-2", target: "n-branch-b-final" },
    // Both Branch A and Branch B Final converge on shared merge node (must only execute once)
    { id: "e-8", source: "n-branch-a", target: "n-merge" },
    { id: "e-9", source: "n-branch-b-final", target: "n-merge" },
  ];

  const [branchWf] = await db
    .insert(workflows)
    .values({
      slug: "regression-branching-approval",
      name: "Regression Branching Approval",
      description: "Multi-branch approval resumption test",
      category: "Testing",
      triggerType: "trigger",
      active: true,
      isTemplate: false,
      nodesJson: nodes,
      edgesJson: edges,
      samplePayload: { tag: "release-42" },
    })
    .returning();

  // Step 1: Starts and pauses at n-approval-1 while n-parallel-queued is still queued
  const paused1 = await executeWorkflow(branchWf.id, { tag: "release-42" }, { db });
  assert.equal(paused1.run.status, "awaiting_approval");
  assert.equal(paused1.run.pausedNodeId, "n-approval-1");
  assert.deepEqual(
    paused1.steps.map((s) => s.nodeId),
    ["n-trigger", "n-approval-1"],
  );

  // Step 2: Approve gate 1 -> Branch A, Branch B, Parallel Queued branch, Merge, and pauses at nested n-approval-2
  const paused2 = await resolveApproval(
    paused1.run.id,
    "approve",
    "Ops Lead",
    "Approved gate 1",
    { db },
  );
  assert.equal(paused2.run.status, "awaiting_approval");
  assert.equal(paused2.run.pausedNodeId, "n-approval-2");

  // Step 3: Approve nested gate 2 -> completes all remaining downstream nodes
  const completed = await resolveApproval(
    paused1.run.id,
    "approve",
    "Release Manager",
    "Approved gate 2",
    { db },
  );
  assert.equal(completed.run.status, "completed");

  const executedNodeIds = completed.steps.map((s) => s.nodeId);
  for (const expectedId of [
    "n-trigger",
    "n-approval-1",
    "n-branch-a",
    "n-branch-b",
    "n-parallel-queued",
    "n-parallel-http",
    "n-approval-2",
    "n-branch-b-final",
    "n-merge",
  ]) {
    const matches = completed.steps.filter((s) => s.nodeId === expectedId);
    assert.equal(
      matches.length,
      1,
      `Expected node ${expectedId} to execute exactly once, saw ${matches.length} (trace: ${executedNodeIds.join(", ")})`,
    );
    assert.equal(matches[0].status, "completed", `Expected node ${expectedId} to be completed`);
  }
});

test("Regression #2: resuming pending approval runs against the run's original snapshotted graph even after workflow edits", async () => {
  const db = await getDb();

  const originalNodes: FlowNode[] = [
    {
      id: "n-trigger",
      type: "flowNode",
      position: { x: 0, y: 0 },
      data: { label: "Start", nodeType: "trigger", config: { eventName: "order.created" } },
    },
    {
      id: "n-approval",
      type: "flowNode",
      position: { x: 200, y: 0 },
      data: {
        label: "Finance Approval",
        nodeType: "human_approval",
        config: { approvalPrompt: "Approve payout dispatch" },
      },
    },
    {
      id: "n-http",
      type: "flowNode",
      position: { x: 400, y: 0 },
      data: {
        label: "Payout Webhook",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/original-payout",
          bodyTemplate: "ORIGINAL_PAYLOAD:{{payload.orderId}}",
        },
      },
    },
  ];
  const originalEdges: FlowEdge[] = [
    { id: "e-1", source: "n-trigger", target: "n-approval" },
    { id: "e-2", source: "n-approval", target: "n-http" },
  ];

  const [wf] = await db
    .insert(workflows)
    .values({
      slug: "regression-snapshot-immutability",
      name: "Original Workflow Name",
      description: "Snapshot immutability regression test",
      category: "Testing",
      triggerType: "trigger",
      active: true,
      isTemplate: false,
      nodesJson: originalNodes,
      edgesJson: originalEdges,
      samplePayload: { orderId: "ORD-777" },
    })
    .returning();

  // Start run -> pauses at approval gate with original graph snapshotted
  const paused = await executeWorkflow(wf.id, { orderId: "ORD-777" }, { db });
  assert.equal(paused.run.status, "awaiting_approval");
  assert.ok(paused.run.graphSnapshotJson, "Expected workflow run to persist graphSnapshotJson");

  // Mutate the workflow in DB while approval is pending:
  // change downstream HTTP URL/bodyTemplate, drop original edge, and inject an unapproved node
  const tamperedNodes: FlowNode[] = [
    originalNodes[0],
    originalNodes[1],
    {
      ...originalNodes[2],
      data: {
        ...originalNodes[2].data,
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/tampered-attacker",
          bodyTemplate: "TAMPERED_PAYLOAD:{{payload.orderId}}",
        },
      },
    },
    {
      id: "n-injected",
      type: "flowNode",
      position: { x: 600, y: 0 },
      data: {
        label: "Injected Unapproved Action",
        nodeType: "http_request",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/injected",
          bodyTemplate: "INJECTED",
        },
      },
    },
  ];
  const tamperedEdges: FlowEdge[] = [
    { id: "e-1", source: "n-trigger", target: "n-approval" },
    { id: "e-injected", source: "n-approval", target: "n-injected" },
  ];

  await db
    .update(workflows)
    .set({
      name: "Mutated Workflow Name",
      nodesJson: tamperedNodes,
      edgesJson: tamperedEdges,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, wf.id));

  // Approve pending run -> MUST execute the original snapshotted graph, NOT the mutated workflow
  const resumed = await resolveApproval(
    paused.run.id,
    "approve",
    "Finance Controller",
    "Approved original preview",
    { db },
  );
  assert.equal(resumed.run.status, "completed");

  const httpStep = resumed.steps.find((s) => s.nodeId === "n-http");
  assert.ok(httpStep, "Expected original n-http step to execute");
  const httpOut = httpStep.outputJson as Record<string, unknown>;
  assert.equal(httpOut.url, "https://hooks.flowos.studio/sandbox/original-payout");
  assert.equal(httpOut.requestPreview, "ORIGINAL_PAYLOAD:ORD-777");

  assert.equal(
    resumed.steps.some((s) => s.nodeId === "n-injected"),
    false,
    "Post-pause injected node must NEVER execute on an already-started run",
  );
});

test("Regression #3: concurrent approval/approval and approval/rejection races are atomically serialized with 409 conflicts", async () => {
  const db = await getDb();

  const [wf] = await db
    .insert(workflows)
    .values({
      slug: "regression-atomic-approval-race",
      name: "Atomic Approval Race Workflow",
      description: "Concurrency regression test",
      category: "Testing",
      triggerType: "trigger",
      active: true,
      isTemplate: false,
      nodesJson: [
        {
          id: "n-trigger",
          type: "flowNode",
          position: { x: 0, y: 0 },
          data: { label: "Start", nodeType: "trigger", config: {} },
        },
        {
          id: "n-approval",
          type: "flowNode",
          position: { x: 200, y: 0 },
          data: { label: "Approval Gate", nodeType: "human_approval", config: {} },
        },
        {
          id: "n-http",
          type: "flowNode",
          position: { x: 400, y: 0 },
          data: {
            label: "External Dispatch",
            nodeType: "http_request",
            config: {
              method: "POST",
              url: "https://hooks.flowos.studio/sandbox/race-check",
              bodyTemplate: "RACE:{{payload.id}}",
            },
          },
        },
      ],
      edgesJson: [
        { id: "e-1", source: "n-trigger", target: "n-approval" },
        { id: "e-2", source: "n-approval", target: "n-http" },
      ],
      samplePayload: { id: "race-1" },
    })
    .returning();

  // Case A: Concurrent approve vs approve -> exactly ONE succeeds, downstream executes AT MOST ONCE
  const runA = await executeWorkflow(wf.id, { id: "race-approve-approve" }, { db });
  assert.equal(runA.run.status, "awaiting_approval");

  const resultsA = await Promise.allSettled([
    resolveApproval(runA.run.id, "approve", "Operator Alpha", "Alpha approves", { db }),
    resolveApproval(runA.run.id, "approve", "Operator Beta", "Beta approves", { db }),
  ]);

  const fulfilledA = resultsA.filter((r) => r.status === "fulfilled");
  const rejectedA = resultsA.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  assert.equal(fulfilledA.length, 1, "Exactly one concurrent approve must succeed");
  assert.equal(rejectedA.length, 1, "Second concurrent approve must fail with conflict");
  assert.ok(rejectedA[0].reason instanceof ApprovalConflictError);
  assert.equal(rejectedA[0].reason.statusCode, 409);

  const stepsA = await db.select().from(runSteps).where(eq(runSteps.runId, runA.run.id));
  const httpStepsA = stepsA.filter((s) => s.nodeId === "n-http");
  assert.equal(httpStepsA.length, 1, "Downstream HTTP action must execute exactly once");

  // Case B: Concurrent reject vs approve -> only ONE wins; if reject wins, downstream NEVER executes
  const runB = await executeWorkflow(wf.id, { id: "race-reject-approve" }, { db });
  assert.equal(runB.run.status, "awaiting_approval");

  const resultsB = await Promise.allSettled([
    resolveApproval(runB.run.id, "reject", "Security Reviewer", "Blocked", { db }),
    resolveApproval(runB.run.id, "approve", "Ops Approver", "Go ahead", { db }),
  ]);

  const fulfilledB = resultsB.filter(
    (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof resolveApproval>>> =>
      r.status === "fulfilled",
  );
  const rejectedB = resultsB.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  assert.equal(fulfilledB.length, 1, "Exactly one decision must win reject-vs-approve race");
  assert.equal(rejectedB.length, 1, "Losing concurrent decision must fail with conflict");
  assert.ok(rejectedB[0].reason instanceof ApprovalConflictError);
  assert.equal(rejectedB[0].reason.statusCode, 409);

  const [finalRunB] = await db
    .select()
    .from(workflowRuns)
    .where(eq(workflowRuns.id, runB.run.id))
    .limit(1);
  const stepsB = await db.select().from(runSteps).where(eq(runSteps.runId, runB.run.id));
  const httpStepsB = stepsB.filter((s) => s.nodeId === "n-http");

  if (finalRunB.status === "rejected") {
    assert.equal(httpStepsB.length, 0, "Rejected winner must NEVER execute downstream HTTP steps");
  } else {
    assert.equal(finalRunB.status, "completed");
    assert.equal(httpStepsB.length, 1, "Approved winner must execute downstream HTTP step exactly once");
  }

  // Case C: Concurrent approve vs reject (reverse order) -> same strict atomicity invariant
  const runC = await executeWorkflow(wf.id, { id: "race-approve-reject" }, { db });
  assert.equal(runC.run.status, "awaiting_approval");

  const resultsC = await Promise.allSettled([
    resolveApproval(runC.run.id, "approve", "Ops Approver", "Go ahead", { db }),
    resolveApproval(runC.run.id, "reject", "Security Reviewer", "Blocked", { db }),
  ]);

  const fulfilledC = resultsC.filter((r) => r.status === "fulfilled");
  const rejectedC = resultsC.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  assert.equal(fulfilledC.length, 1);
  assert.equal(rejectedC.length, 1);
  assert.ok(rejectedC[0].reason instanceof ApprovalConflictError);

  const [finalRunC] = await db
    .select()
    .from(workflowRuns)
    .where(eq(workflowRuns.id, runC.run.id))
    .limit(1);
  const stepsC = await db.select().from(runSteps).where(eq(runSteps.runId, runC.run.id));
  const httpStepsC = stepsC.filter((s) => s.nodeId === "n-http");
  if (finalRunC.status === "rejected") {
    assert.equal(httpStepsC.length, 0);
  } else {
    assert.equal(finalRunC.status, "completed");
    assert.equal(httpStepsC.length, 1);
  }

  // Case D: Non-existent run ID throws RunNotFoundError (404)
  await assert.rejects(
    () =>
      resolveApproval("00000000-0000-0000-0000-000000000000", "approve", "Ops", "Missing", {
        db,
      }),
    (err: unknown) => err instanceof RunNotFoundError && err.statusCode === 404,
  );
});
