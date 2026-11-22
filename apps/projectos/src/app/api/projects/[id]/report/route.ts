import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects, tasks, timeEntries } from "@/db/schema";
import { buildProjectReport, serializeProjectReportCsv } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const [pMilestones, pTasks, pEntries] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.projectId, id)),
    db.select().from(tasks).where(eq(tasks.projectId, id)),
    db.select().from(timeEntries).where(eq(timeEntries.projectId, id)),
  ]);

  const report = buildProjectReport(project, pMilestones, pTasks, pEntries);
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const csv = serializeProjectReportCsv(report);
    const filename = `${project.code.toLowerCase()}-progress-report.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ report });
}
