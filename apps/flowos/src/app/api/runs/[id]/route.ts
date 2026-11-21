import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { runSteps, workflowRuns } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();
  const [run] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, id)).limit(1);
  if (!run) {
    return NextResponse.json({ error: "Workflow run not found." }, { status: 404 });
  }

  const steps = await db
    .select()
    .from(runSteps)
    .where(eq(runSteps.runId, id))
    .orderBy(asc(runSteps.stepOrder));

  return NextResponse.json({ run, steps });
}
