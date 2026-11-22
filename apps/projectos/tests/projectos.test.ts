import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
  type TeamMemberRow,
  type TimeEntryRow,
} from "@/db/schema";
import {
  buildProjectReport,
  computeDashboardMetrics,
  computeTaskBlockedState,
  computeTeamUtilization,
  escapeCsvCell,
  resolveUtilizationPeriod,
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

describe("ProjectOS — Codex Review Regression Tests", () => {
  it("limits weekly utilization to the 7-day capacity period while preserving all-time billable totals", () => {
    const now = new Date();
    const members: TeamMemberRow[] = [
      {
        id: "m-1",
        name: "Marcus Chen",
        roleTitle: "Staff Full-Stack Engineer",
        email: "marcus@projectos.studio",
        capacityHours: 40,
        avatarColor: "#2563eb",
        createdAt: now,
      },
    ];

    const entries: TimeEntryRow[] = [
      {
        id: "te-old",
        projectId: "p-1",
        taskId: null,
        memberName: "Marcus Chen",
        hours: 20,
        billable: true,
        note: "Work logged 3 weeks ago",
        loggedDate: "2026-10-28",
        createdAt: now,
      },
      {
        id: "te-current",
        projectId: "p-1",
        taskId: null,
        memberName: "Marcus Chen",
        hours: 16,
        billable: true,
        note: "Work logged in current ISO week",
        loggedDate: "2026-11-18",
        createdAt: now,
      },
    ];

    // Default period resolves to ISO Monday–Sunday week containing latest loggedDate (2026-11-18)
    const period = resolveUtilizationPeriod(entries);
    assert.equal(period.weekStart, "2026-11-16");
    assert.equal(period.weekEnd, "2026-11-22");

    const rows = computeTeamUtilization(members, entries, [], { referenceDate: "2026-11-18" });
    assert.equal(rows.length, 1);
    const marcus = rows[0];

    // 16h in current week / 40h capacity = 40%, NOT 36h / 40h = 90%
    assert.equal(marcus.loggedHours, 16);
    assert.equal(marcus.billableHours, 16);
    assert.equal(marcus.utilizationPct, 40);
    assert.equal(marcus.weekStart, "2026-11-16");
    assert.equal(marcus.weekEnd, "2026-11-22");

    // Lifetime totals still reflect all 36h across both weeks
    assert.equal(marcus.lifetimeHours, 36);
    assert.equal(marcus.totalBillableHours, 36);
  });

  it("removes fixed positioning, max-height, and scroll clipping on printable project reports", () => {
    const globalsCss = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );
    const projectsPage = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "(workspace)", "projects", "page.tsx"),
      "utf8",
    );

    // Extract @media print block from globals.css
    const printIdx = globalsCss.indexOf("@media print");
    assert.ok(printIdx !== -1, "globals.css must declare an @media print section");
    const printCss = globalsCss.slice(printIdx);

    // Overlay and modal print classes must be wired in projects/page.tsx
    assert.ok(
      projectsPage.includes("print-report-overlay"),
      "projects/page.tsx must apply print-report-overlay on the report backdrop",
    );
    assert.ok(
      projectsPage.includes("print-report-modal"),
      "projects/page.tsx must apply print-report-modal on the report container",
    );
    assert.ok(
      projectsPage.includes("print:hidden"),
      "projects/page.tsx must keep print:hidden on non-report chrome",
    );
    assert.ok(
      projectsPage.includes("print:static") && projectsPage.includes("print:max-h-none"),
      "projects/page.tsx must override fixed positioning and max-h-[90vh] in print mode",
    );

    // Verify @media print CSS resets position, max-height, and overflow constraints
    assert.match(printCss, /\.print-report-overlay[\s\S]*?position:\s*static\s*!important/);
    assert.match(printCss, /\.print-report-overlay[\s\S]*?overflow:\s*visible\s*!important/);
    assert.match(printCss, /\.print-report-modal[\s\S]*?max-height:\s*none\s*!important/);
    assert.match(printCss, /\.print-report-modal[\s\S]*?height:\s*auto\s*!important/);
    assert.match(printCss, /\.print-report-modal[\s\S]*?overflow:\s*visible\s*!important/);
    assert.match(printCss, /\.no-print[\s\S]*?display:\s*none\s*!important/);
  });

  it("rolls back TRUNCATE and partial writes if resetDemoWorkspace fails mid-seed, and succeeds atomically otherwise", async () => {
    const db = await getDb();

    // Create a custom pre-reset project and task to verify rollback preservation
    const [customProject] = await db
      .insert(projects)
      .values({
        code: "PRJ-ROLLBACK",
        name: "Transactional Safety Verification",
        clientName: "Safety Corp",
        description: "Must survive a failed resetDemoWorkspace attempt",
        status: "active",
        budgetHours: 80,
        startDate: "2026-11-22",
        targetDate: "2026-12-31",
        clientPortalEnabled: true,
      })
      .returning();

    const [customTask] = await db
      .insert(tasks)
      .values({
        projectId: customProject.id,
        title: "Verify rollback preserves pre-reset task",
        stage: "in_progress",
        priority: "high",
        assigneeName: "Morgan Ellis",
        estimatedHours: 6,
        dueDate: "2026-12-05",
      })
      .returning();

    const projectsBefore = await db.select().from(projects);
    const tasksBefore = await db.select().from(tasks);
    const membersBefore = await db.select().from(teamMembers);

    // Inject a failure AFTER TRUNCATE and AFTER a partial insert inside the same transaction
    await assert.rejects(
      () =>
        resetDemoWorkspace({
          seeder: async (tx) => {
            const insideTxProjects = await tx.select().from(projects);
            assert.equal(
              insideTxProjects.length,
              0,
              "TRUNCATE must have cleared projects inside the active transaction",
            );
            await tx.insert(teamMembers).values({
              name: "Mid-Seed Ghost",
              roleTitle: "Transient",
              email: "ghost@projectos.studio",
              capacityHours: 40,
              avatarColor: "#000000",
            });
            throw new Error("Simulated mid-seed failure");
          },
        }),
      /Simulated mid-seed failure/,
    );

    // Assert full rollback: custom project/task AND baseline rows are 100% intact, ghost row absent
    const projectsAfterFail = await db.select().from(projects);
    const tasksAfterFail = await db.select().from(tasks);
    const membersAfterFail = await db.select().from(teamMembers);

    assert.equal(projectsAfterFail.length, projectsBefore.length);
    assert.equal(tasksAfterFail.length, tasksBefore.length);
    assert.equal(membersAfterFail.length, membersBefore.length);
    assert.ok(
      projectsAfterFail.some((p) => p.id === customProject.id && p.code === "PRJ-ROLLBACK"),
      "Custom pre-reset project must remain intact after rolled-back reset",
    );
    assert.ok(
      tasksAfterFail.some((t) => t.id === customTask.id),
      "Custom pre-reset task must remain intact after rolled-back reset",
    );
    assert.equal(
      membersAfterFail.some((m) => m.email === "ghost@projectos.studio"),
      false,
      "Partial mid-seed insert must be rolled back",
    );

    // Now verify a normal resetDemoWorkspace() succeeds atomically
    await resetDemoWorkspace();
    const projectsAfterSuccess = await db.select().from(projects);
    const membersAfterSuccess = await db.select().from(teamMembers);

    assert.equal(projectsAfterSuccess.length, 4, "Normal reset must restore 4 baseline projects");
    assert.equal(
      projectsAfterSuccess.some((p) => p.code === "PRJ-ROLLBACK"),
      false,
      "Normal reset must clear custom project",
    );
    assert.equal(membersAfterSuccess.length, 5, "Normal reset must restore 5 baseline team members");
  });
});
