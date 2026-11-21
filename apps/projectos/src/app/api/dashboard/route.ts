import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, milestones, projects, tasks, timeEntries } from "@/db/schema";
import { computeDashboardMetrics } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [projectsList, milestonesList, tasksList, entriesList, recentActivity] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db.select().from(milestones),
    db.select().from(tasks),
    db.select().from(timeEntries),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(16),
  ]);

  const metrics = computeDashboardMetrics(projectsList, milestonesList, tasksList, entriesList);
  return NextResponse.json({
    ...metrics,
    activityLogs: recentActivity,
  });
}
