import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workflowRuns } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const workflowId = searchParams.get("workflowId");

  const db = await getDb();
  let rows = await db.select().from(workflowRuns).orderBy(desc(workflowRuns.startedAt));

  if (status && status !== "all") {
    rows = rows.filter((r) => r.status === status);
  }
  if (workflowId) {
    rows = rows.filter((r) => r.workflowId === workflowId);
  }

  void eq;
  return NextResponse.json({ runs: rows });
}
