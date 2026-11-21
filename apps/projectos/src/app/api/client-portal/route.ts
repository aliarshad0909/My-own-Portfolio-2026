import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects, tasks, timeEntries } from "@/db/schema";
import { roundHours } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";

/**
 * Sanitized read-only client portal feed.
 * Deliberately excludes internal task_comments, internal activity_logs,
 * non-billable cost notes, and admin mutation controls.
 */
export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [portalProjects, allMilestones, allTasks, allEntries] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(eq(projects.clientPortalEnabled, true))
      .orderBy(desc(projects.createdAt)),
    db.select().from(milestones),
    db.select().from(tasks),
    db.select().from(timeEntries),
  ]);

  const sanitizedProjects = portalProjects.map((project) => {
    const pMilestones = allMilestones
      .filter((m) => m.projectId === project.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((m) => ({
        id: m.id,
        title: m.title,
        dueDate: m.dueDate,
        status: m.status,
      }));

    const pTasks = allTasks.filter((t) => t.projectId === project.id);
    const completedDeliverables = pTasks.filter((t) => t.stage === "done").length;
    const completedMilestones = pMilestones.filter((m) => m.status === "completed").length;
    const pEntries = allEntries.filter((e) => e.projectId === project.id);
    const hoursUtilized = roundHours(pEntries.reduce((acc, e) => acc + Number(e.hours || 0), 0));
    const budgetUtilizationPct =
      project.budgetHours > 0 ? Math.round((hoursUtilized / project.budgetHours) * 100) : 0;

    return {
      id: project.id,
      code: project.code,
      name: project.name,
      clientName: project.clientName,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      targetDate: project.targetDate,
      budgetHours: project.budgetHours,
      hoursUtilized,
      budgetUtilizationPct,
      milestoneProgressPct:
        pMilestones.length > 0 ? Math.round((completedMilestones / pMilestones.length) * 100) : 0,
      deliverablesProgressPct:
        pTasks.length > 0 ? Math.round((completedDeliverables / pTasks.length) * 100) : 0,
      completedMilestones,
      totalMilestones: pMilestones.length,
      completedDeliverables,
      totalDeliverables: pTasks.length,
      milestones: pMilestones,
      deliverables: pTasks.map((t) => ({
        id: t.id,
        title: t.title,
        stage: t.stage,
        priority: t.priority,
        dueDate: t.dueDate,
        deliverableFile: t.attachmentName || null,
        completed: t.stage === "done",
      })),
    };
  });

  return NextResponse.json({ projects: sanitizedProjects });
}
