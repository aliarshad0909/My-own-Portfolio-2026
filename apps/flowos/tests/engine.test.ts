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
  evaluateCondition,
  executeWorkflow,
  resolveApproval,
  retryWorkflowRun,
  runDeterministicAi,
} from "@/lib/engine";
import { validateSafeExternalUrl } from "@/lib/security";

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
