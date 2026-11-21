import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Force isolated in-memory PostgreSQL for tests so local dev pgdata is untouched.
process.env.DATABASE_URL = "";
process.env.PROJECTOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import {
  milestones,
  projects,
  sessions,
  taskComments,
  tasks,
  teamMembers,
  timeEntries,
  users,
} from "@/db/schema";
import {
  buildProjectReport,
  computeDashboardMetrics,
  computeTaskBlockedState,
  computeTeamUtilization,
  escapeCsvCell,
  serializeProjectReportCsv,
} from "@/lib/analytics";
import {
  DEMO_ACCOUNT,
  generateLockedPassword,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/lib/crypto";
import { createProjectSchema, createTaskSchema, createTimeEntrySchema } from "@/lib/validation";

describe("ProjectOS — Security, Crypto & Validation Unit Tests", () => {
  it("hashes and verifies passwords with scrypt timing-safe comparison", () => {
    const hash = hashPassword("StudioPass2026!");
    assert.ok(hash.includes(":"));
    assert.equal(verifyPassword("StudioPass2026!", hash), true);
    assert.equal(verifyPassword("WrongPass", hash), false);

    const locked1 = generateLockedPassword();
    const locked2 = generateLockedPassword();
    assert.equal(locked1.length, 64);
    assert.notEqual(locked1, locked2);
  });

  it("validates project, task, and time entry schemas strictly", () => {
    const proj = createProjectSchema.safeParse({
      code: "prj-200",
      name: "Quantum Design System",
      clientName: "Quantum Labs",
      budgetHours: 160,
      startDate: "2026-11-22",
      targetDate: "2027-01-10",
    });
    assert.equal(proj.success, true);
    if (proj.success) {
      assert.equal(proj.data.code, "PRJ-200");
    }

    const badTime = createTimeEntrySchema.safeParse({
      projectId: "not-a-uuid",
      memberName: "Morgan Ellis",
      hours: 30,
      loggedDate: "2026-11-22",
    });
    assert.equal(badTime.success, false);

    const badTask = createTaskSchema.safeParse({
      projectId: "not-a-uuid",
      title: "A",
    });
    assert.equal(badTask.success, false);
  });

  it("detects task dependency blockers accurately and escapes CSV cells", () => {
    const taskMap = new Map([
      ["t1", { id: "t1", title: "API Schema", stage: "in_progress" }],
      ["t2", { id: "t2", title: "UI Grid", stage: "todo" }],
      ["t3", { id: "t3", title: "Completed Prereq", stage: "done" }],
    ]);

    const blocked = computeTaskBlockedState({ dependsOnTaskId: "t1", stage: "todo" }, taskMap);
    assert.equal(blocked.isBlocked, true);
    assert.equal(blocked.prerequisiteTitle, "API Schema");

    const clear = computeTaskBlockedState({ dependsOnTaskId: "t3", stage: "todo" }, taskMap);
    assert.equal(clear.isBlocked, false);

    assert.equal(escapeCsvCell('Hello, "World"'), '"Hello, ""World"""');
  });
});

describe("ProjectOS — Full End-to-End PostgreSQL Workflow Integration", () => {
  it("runs create project -> milestone -> dependent task -> kanban move -> time log -> complete milestone -> report -> demo reset", async () => {
    const db = await getDb();

    // Verify seeded demo user & create a session to confirm resetDemoWorkspace preserves it
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    assert.ok(demoUser, "Demo PM user must be seeded");
    assert.equal(verifyPassword(DEMO_ACCOUNT.password, demoUser.passwordHash), true);

    const sessionTokenHash = hashSessionToken(generateSessionToken());
    await db.insert(sessions).values({
      tokenHash: sessionTokenHash,
      userId: demoUser.id,
      expiresAt: new Date(Date.now() + 3600_000),
    });

    // 1. Create a new Project
    const [project] = await db
      .insert(projects)
      .values({
        code: "PRJ-901",
        name: "Orbital Telemetry Workspace",
        clientName: "Orbital Dynamics",
        description: "End-to-end delivery verification project",
        status: "active",
        budgetHours: 100,
        startDate: "2026-11-22",
        targetDate: "2026-12-30",
        clientPortalEnabled: true,
      })
      .returning();
    assert.equal(project.code, "PRJ-901");

    // 2. Create a Milestone
    const [milestone] = await db
      .insert(milestones)
      .values({
        projectId: project.id,
        title: "M1: Telemetry Core Sign-Off",
        dueDate: "2026-12-10",
        status: "in_progress",
      })
      .returning();
    assert.equal(milestone.status, "in_progress");

    // 3. Create prerequisite task + dependent task (with attachment metadata)
    const [prereqTask] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        milestoneId: milestone.id,
        title: "Build telemetry ingestion schema",
        stage: "todo",
        priority: "urgent",
        assigneeName: "Marcus Chen",
        estimatedHours: 8,
        dueDate: "2026-12-01",
        attachmentName: "telemetry-schema-v1.sql",
      })
      .returning();

    const [dependentTask] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        milestoneId: milestone.id,
        title: "Wire live orbital stream chart",
        stage: "backlog",
        priority: "high",
        assigneeName: "Devon Brooks",
        dependsOnTaskId: prereqTask.id,
        estimatedHours: 12,
        dueDate: "2026-12-08",
        attachmentName: "orbital-chart-spec.figma",
      })
      .returning();

    // Verify dependent task is currently blocked
    let pTasks = await db.select().from(tasks).where(eq(tasks.projectId, project.id));
    let blocker = computeTaskBlockedState(
      dependentTask,
      new Map(pTasks.map((t) => [t.id, t])),
    );
    assert.equal(blocker.isBlocked, true);
    assert.equal(blocker.prerequisiteTitle, prereqTask.title);

    // 4. Move prerequisite task through Kanban stages -> done
    for (const stage of ["in_progress", "review", "done"] as const) {
      await db.update(tasks).set({ stage }).where(eq(tasks.id, prereqTask.id));
    }

    // Verify dependent task is now unblocked
    pTasks = await db.select().from(tasks).where(eq(tasks.projectId, project.id));
    blocker = computeTaskBlockedState(
      dependentTask,
      new Map(pTasks.map((t) => [t.id, t])),
    );
    assert.equal(blocker.isBlocked, false);

    // Move dependent task to in_progress and add a comment
    await db.update(tasks).set({ stage: "in_progress" }).where(eq(tasks.id, dependentTask.id));
    const [comment] = await db
      .insert(taskComments)
      .values({
        taskId: dependentTask.id,
        authorName: "Devon Brooks",
        body: "Prerequisite schema merged; chart streaming now connected.",
      })
      .returning();
    assert.equal(comment.taskId, dependentTask.id);

    // 5. Log billable & non-billable time entries
    await db.insert(timeEntries).values([
      {
        projectId: project.id,
        taskId: prereqTask.id,
        memberName: "Marcus Chen",
        hours: 7.5,
        billable: true,
        note: "Implemented PostgreSQL ingestion schema",
        loggedDate: "2026-11-22",
      },
      {
        projectId: project.id,
        taskId: dependentTask.id,
        memberName: "Devon Brooks",
        hours: 2.5,
        billable: false,
        note: "Internal pairing and review prep",
        loggedDate: "2026-11-22",
      },
    ]);

    // 6. Complete Milestone (1-click sign-off)
    const [completedMs] = await db
      .update(milestones)
      .set({ status: "completed" })
      .where(eq(milestones.id, milestone.id))
      .returning();
    assert.equal(completedMs.status, "completed");

    // 7. Verify Progress Report (JSON + CSV) derived from real DB rows
    const [pMilestones, updatedTasks, pEntries, allMembers] = await Promise.all([
      db.select().from(milestones).where(eq(milestones.projectId, project.id)),
      db.select().from(tasks).where(eq(tasks.projectId, project.id)),
      db.select().from(timeEntries).where(eq(timeEntries.projectId, project.id)),
      db.select().from(teamMembers),
    ]);

    const report = buildProjectReport(project, pMilestones, updatedTasks, pEntries);
    assert.equal(report.summary.totalTasks, 2);
    assert.equal(report.summary.completedTasks, 1);
    assert.equal(report.summary.completionPct, 50);
    assert.equal(report.summary.blockedTasks, 0);
    assert.equal(report.summary.completedMilestones, 1);
    assert.equal(report.summary.loggedHours, 10);
    assert.equal(report.summary.billableHours, 7.5);
    assert.equal(report.summary.nonBillableHours, 2.5);
    assert.equal(report.summary.budgetRemainingHours, 90);

    const csv = serializeProjectReportCsv(report);
    assert.ok(csv.includes("PRJ-901 - Orbital Telemetry Workspace"));
    assert.ok(csv.includes("M1: Telemetry Core Sign-Off"));
    assert.ok(csv.includes("Build telemetry ingestion schema"));
    assert.ok(csv.includes("7.5h"));

    // Verify team utilization rollup includes our logged hours
    const util = computeTeamUtilization(allMembers, pEntries, updatedTasks);
    const marcus = util.find((m) => m.name === "Marcus Chen");
    assert.ok(marcus);
    assert.equal(marcus.billableHours, 7.5);

    // Verify dashboard metrics reflect the new project
    const [allProjects, allMs, allTasks, allEntries] = await Promise.all([
      db.select().from(projects),
      db.select().from(milestones),
      db.select().from(tasks),
      db.select().from(timeEntries),
    ]);
    const dashboard = computeDashboardMetrics(allProjects, allMs, allTasks, allEntries);
    assert.ok(dashboard.projectAnalytics.some((p) => p.code === "PRJ-901"));

    // 8. Verify demo reset restores baseline seeded data while keeping active sessions intact
    await resetDemoWorkspace();
    const afterResetProjects = await db.select().from(projects);
    assert.equal(
      afterResetProjects.some((p) => p.code === "PRJ-901"),
      false,
      "Custom test project must be cleared by demo reset",
    );
    assert.equal(afterResetProjects.length, 4, "4 seeded projects must be restored");

    const preservedSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, sessionTokenHash));
    assert.equal(preservedSessions.length, 1, "Active user session must survive demo reset");
  });
});
