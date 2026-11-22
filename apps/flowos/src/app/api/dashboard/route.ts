import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { integrations, workflowRuns, workflows } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [allWorkflows, allRuns, allIntegrations] = await Promise.all([
    db.select().from(workflows).where(eq(workflows.isTemplate, false)).orderBy(desc(workflows.updatedAt)),
    db.select().from(workflowRuns).orderBy(desc(workflowRuns.startedAt)),
    db.select().from(integrations),
  ]);

  const activeWorkflowsCount = allWorkflows.filter((w) => w.active).length;
  const totalRuns = allRuns.length;
  const completedRuns = allRuns.filter((r) => r.status === "completed").length;
  const awaitingApprovalRuns = allRuns.filter((r) => r.status === "awaiting_approval");
  const failedRuns = allRuns.filter((r) => r.status === "failed").length;
  const finalizedRuns = allRuns.filter(
    (r) => r.status === "completed" || r.status === "failed" || r.status === "rejected",
  ).length;
  const successRate = finalizedRuns > 0 ? Math.round((completedRuns / finalizedRuns) * 100) : 100;

  // 7-day execution analytics series
  const now = new Date();
  const dayBuckets: Array<{
    dateKey: string;
    label: string;
    completed: number;
    awaiting: number;
    failed: number;
    total: number;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    dayBuckets.push({ dateKey: key, label, completed: 0, awaiting: 0, failed: 0, total: 0 });
  }
  const bucketMap = new Map(dayBuckets.map((b) => [b.dateKey, b]));

  for (const run of allRuns) {
    const key = new Date(run.startedAt).toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (run.status === "completed") bucket.completed += 1;
    else if (run.status === "awaiting_approval") bucket.awaiting += 1;
    else if (run.status === "failed" || run.status === "rejected") bucket.failed += 1;
  }

  // Per-workflow breakdown
  const perWorkflow = allWorkflows.map((wf) => {
    const wfRuns = allRuns.filter((r) => r.workflowId === wf.id);
    const wfCompleted = wfRuns.filter((r) => r.status === "completed").length;
    const wfPending = wfRuns.filter((r) => r.status === "awaiting_approval").length;
    const wfFailed = wfRuns.filter((r) => r.status === "failed").length;
    const avgDurationMs =
      wfRuns.length > 0
        ? Math.round(wfRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) / wfRuns.length)
        : 0;
    return {
      id: wf.id,
      name: wf.name,
      category: wf.category,
      triggerType: wf.triggerType,
      active: wf.active,
      nodeCount: Array.isArray(wf.nodesJson) ? wf.nodesJson.length : 0,
      totalRuns: wfRuns.length,
      completedRuns: wfCompleted,
      pendingApprovals: wfPending,
      failedRuns: wfFailed,
      avgDurationMs,
    };
  });

  return NextResponse.json({
    kpis: {
      activeWorkflows: activeWorkflowsCount,
      totalWorkflows: allWorkflows.length,
      totalRuns,
      successRate,
      pendingApprovals: awaitingApprovalRuns.length,
      failedRuns,
      enabledIntegrations: allIntegrations.filter((i) => i.enabled).length,
    },
    chart: dayBuckets,
    pendingApprovals: awaitingApprovalRuns.slice(0, 6),
    recentRuns: allRuns.slice(0, 10),
    perWorkflow,
  });
}
