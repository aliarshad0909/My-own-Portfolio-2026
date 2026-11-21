import type { AppDatabase } from "@/db";
import {
  activityLogs,
  milestones,
  projects,
  taskComments,
  tasks,
  teamMembers,
  timeEntries,
  users,
} from "@/db/schema";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";

type SeedOptions = {
  usersOnly?: boolean;
  skipUsers?: boolean;
};

export async function seedDemoData(db: AppDatabase, options: SeedOptions = {}): Promise<void> {
  if (!options.skipUsers) {
    await db
      .insert(users)
      .values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: DEMO_ACCOUNT.role,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          avatarColor: "#7c3aed",
        },
        {
          email: "elena@projectos.studio",
          name: "Elena Rostova",
          role: "pm",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#8b5cf6",
        },
        {
          email: "marcus@projectos.studio",
          name: "Marcus Chen",
          role: "engineer",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#2563eb",
        },
      ])
      .onConflictDoNothing({ target: users.email });
  }

  if (options.usersOnly) return;

  await db
    .insert(teamMembers)
    .values([
      {
        name: "Morgan Ellis",
        roleTitle: "Delivery Director",
        email: "pm@projectos.studio",
        capacityHours: 40,
        avatarColor: "#7c3aed",
      },
      {
        name: "Elena Rostova",
        roleTitle: "Principal Product Designer",
        email: "elena@projectos.studio",
        capacityHours: 40,
        avatarColor: "#a855f7",
      },
      {
        name: "Marcus Chen",
        roleTitle: "Staff Full-Stack Engineer",
        email: "marcus@projectos.studio",
        capacityHours: 40,
        avatarColor: "#2563eb",
      },
      {
        name: "Priya Nair",
        roleTitle: "Platform & QA Lead",
        email: "priya@projectos.studio",
        capacityHours: 36,
        avatarColor: "#059669",
      },
      {
        name: "Devon Brooks",
        roleTitle: "Frontend Systems Engineer",
        email: "devon@projectos.studio",
        capacityHours: 32,
        avatarColor: "#d97706",
      },
    ])
    .onConflictDoNothing({ target: teamMembers.email });

  const insertedProjects = await db
    .insert(projects)
    .values([
      {
        code: "PRJ-101",
        name: "Helios FinTech Core Redesign",
        clientName: "Helios Financial Group",
        description:
          "Design system overhaul, treasury workflow modernization, and real-time liquidity dashboard for institutional operators.",
        status: "active",
        budgetHours: 240,
        startDate: "2026-10-05",
        targetDate: "2026-12-18",
        clientPortalEnabled: true,
      },
      {
        code: "PRJ-102",
        name: "Northstar Logistics Telemetry API",
        clientName: "Northstar Freight Systems",
        description:
          "Multi-region fleet event ingestion pipeline, SLA alerting engine, and carrier partner dispatch portal.",
        status: "at_risk",
        budgetHours: 180,
        startDate: "2026-10-12",
        targetDate: "2026-12-04",
        clientPortalEnabled: true,
      },
      {
        code: "PRJ-103",
        name: "Aether BioLab Clinical Portal",
        clientName: "Aether Diagnostics",
        description:
          "HIPAA-ready study enrollment tracker, specimen chain-of-custody ledger, and clinician review workspace.",
        status: "active",
        budgetHours: 160,
        startDate: "2026-11-01",
        targetDate: "2027-01-15",
        clientPortalEnabled: true,
      },
      {
        code: "PRJ-104",
        name: "Veridian Commerce Headless Launch",
        clientName: "Veridian Retail Co.",
        description:
          "Edge-cached storefront migration, checkout latency optimization, and merchandising CMS rollout.",
        status: "completed",
        budgetHours: 140,
        startDate: "2026-08-18",
        targetDate: "2026-10-30",
        clientPortalEnabled: false,
      },
    ])
    .returning();

  const [pHelios, pNorthstar, pAether, pVeridian] = insertedProjects;

  const insertedMilestones = await db
    .insert(milestones)
    .values([
      {
        projectId: pHelios.id,
        title: "M1: Information Architecture & Token Spec",
        dueDate: "2026-10-28",
        status: "completed",
      },
      {
        projectId: pHelios.id,
        title: "M2: Treasury Workspace Beta",
        dueDate: "2026-11-29",
        status: "in_progress",
      },
      {
        projectId: pHelios.id,
        title: "M3: Security Audit & Production Cutover",
        dueDate: "2026-12-16",
        status: "upcoming",
      },
      {
        projectId: pNorthstar.id,
        title: "M1: Event Broker Schema & Ingest",
        dueDate: "2026-11-06",
        status: "completed",
      },
      {
        projectId: pNorthstar.id,
        title: "M2: Dispatch SLA Engine & Alerts",
        dueDate: "2026-11-26",
        status: "in_progress",
      },
      {
        projectId: pNorthstar.id,
        title: "M3: Load Testing & Partner Sign-Off",
        dueDate: "2026-12-03",
        status: "upcoming",
      },
      {
        projectId: pAether.id,
        title: "M1: Compliance Architecture & Role Matrix",
        dueDate: "2026-11-24",
        status: "in_progress",
      },
      {
        projectId: pAether.id,
        title: "M2: Clinician Review MVP",
        dueDate: "2026-12-20",
        status: "upcoming",
      },
      {
        projectId: pVeridian.id,
        title: "M1: Edge Storefront Go-Live",
        dueDate: "2026-10-25",
        status: "completed",
      },
    ])
    .returning();

  const [mH1, mH2, mH3, mN1, mN2, mN3, mA1, mA2, mV1] = insertedMilestones;

  // Insert root/prerequisite tasks first so dependent tasks can reference their UUIDs
  const [tHeliosTokens, tHeliosApi, tNorthstarBroker, tAetherRbac, tVeridianEdge] = await db
    .insert(tasks)
    .values([
      {
        projectId: pHelios.id,
        milestoneId: mH1.id,
        title: "Finalize Helios design token palette & typography scale",
        description: "Publish WCAG AA semantic tokens for tables, cashflow charts, and dark navigation.",
        stage: "done",
        priority: "high",
        assigneeName: "Elena Rostova",
        estimatedHours: 14,
        dueDate: "2026-10-24",
        attachmentName: "helios-design-tokens-v2.figma",
      },
      {
        projectId: pHelios.id,
        milestoneId: mH2.id,
        title: "Implement real-time treasury ledger aggregation endpoint",
        description: "Stream multi-currency positions with sub-150ms p95 latency and idempotent reconciliation.",
        stage: "in_progress",
        priority: "urgent",
        assigneeName: "Marcus Chen",
        estimatedHours: 20,
        dueDate: "2026-11-26",
        attachmentName: "treasury-api-openapi.yaml",
      },
      {
        projectId: pNorthstar.id,
        milestoneId: mN1.id,
        title: "Deploy regional Kafka consumer & telemetry validator",
        description: "Validate GPS + cold-chain sensor envelopes with dead-letter retry queues.",
        stage: "done",
        priority: "high",
        assigneeName: "Marcus Chen",
        estimatedHours: 18,
        dueDate: "2026-11-04",
        attachmentName: "telemetry-envelope-schema.json",
      },
      {
        projectId: pAether.id,
        milestoneId: mA1.id,
        title: "Author clinical RBAC permission matrix & audit trail spec",
        description: "Define principal investigator, lab coordinator, and read-only sponsor boundaries.",
        stage: "review",
        priority: "high",
        assigneeName: "Priya Nair",
        estimatedHours: 12,
        dueDate: "2026-11-23",
        attachmentName: "aether-rbac-matrix-v1.pdf",
      },
      {
        projectId: pVeridian.id,
        milestoneId: mV1.id,
        title: "Zero-downtime DNS cutover & Core Web Vitals verification",
        description: "Validated LCP < 1.3s across top 40 merchandising landing pages.",
        stage: "done",
        priority: "high",
        assigneeName: "Devon Brooks",
        estimatedHours: 10,
        dueDate: "2026-10-24",
        attachmentName: "veridian-lighthouse-audit.pdf",
      },
    ])
    .returning();

  const [tNorthstarSla] = await db
    .insert(tasks)
    .values([
      {
        projectId: pNorthstar.id,
        milestoneId: mN2.id,
        title: "Build SLA breach detection rules & webhook dispatcher",
        description: "Detect route delays > 20m and fire signed partner webhook payloads.",
        stage: "in_progress",
        priority: "urgent",
        assigneeName: "Priya Nair",
        dependsOnTaskId: tNorthstarBroker.id,
        estimatedHours: 16,
        dueDate: "2026-11-25",
        attachmentName: "sla-webhook-contract.md",
      },
    ])
    .returning();

  const moreTasks = await db
    .insert(tasks)
    .values([
      {
        projectId: pHelios.id,
        milestoneId: mH2.id,
        title: "Build interactive liquidity forecast grid & CSV export",
        description: "Wire live ledger aggregation endpoint into 90-day cash position grid with scenario filters.",
        stage: "todo",
        priority: "high",
        assigneeName: "Devon Brooks",
        dependsOnTaskId: tHeliosApi.id,
        estimatedHours: 16,
        dueDate: "2026-11-29",
        attachmentName: "liquidity-grid-wireframes.pdf",
      },
      {
        projectId: pHelios.id,
        milestoneId: mH2.id,
        title: "Executive navigation rail & account switcher polish",
        description: "Apply approved Helios token palette to workspace header and entity selector.",
        stage: "review",
        priority: "medium",
        assigneeName: "Elena Rostova",
        dependsOnTaskId: tHeliosTokens.id,
        estimatedHours: 8,
        dueDate: "2026-11-24",
        attachmentName: "nav-interaction-notes.md",
      },
      {
        projectId: pHelios.id,
        milestoneId: mH3.id,
        title: "Penetration test remediation & SOC2 evidence pack",
        description: "Verify CSP headers, session rotation, and audit export controls prior to launch.",
        stage: "backlog",
        priority: "medium",
        assigneeName: "Priya Nair",
        dependsOnTaskId: tHeliosApi.id,
        estimatedHours: 12,
        dueDate: "2026-12-12",
        attachmentName: "",
      },
      {
        projectId: pNorthstar.id,
        milestoneId: mN3.id,
        title: "Run 25k events/sec soak test against dispatch alerts",
        description: "Simulate peak holiday freight volume once SLA breach webhook engine is complete.",
        stage: "todo",
        priority: "urgent",
        assigneeName: "Marcus Chen",
        dependsOnTaskId: tNorthstarSla.id,
        estimatedHours: 14,
        dueDate: "2026-12-01",
        attachmentName: "k6-soak-plan.js",
      },
      {
        projectId: pNorthstar.id,
        milestoneId: mN2.id,
        title: "Carrier portal exception triage drawer",
        description: "Allow dispatch managers to acknowledge delayed shipments and assign escalation owners.",
        stage: "review",
        priority: "medium",
        assigneeName: "Devon Brooks",
        estimatedHours: 10,
        dueDate: "2026-11-27",
        attachmentName: "triage-drawer-spec.png",
      },
      {
        projectId: pAether.id,
        milestoneId: mA2.id,
        title: "Implement clinician specimen sign-off workflow",
        description: "Enforce two-step electronic verification gated by the clinical RBAC permission matrix.",
        stage: "todo",
        priority: "high",
        assigneeName: "Marcus Chen",
        dependsOnTaskId: tAetherRbac.id,
        estimatedHours: 18,
        dueDate: "2026-12-10",
        attachmentName: "specimen-signoff-flow.svg",
      },
      {
        projectId: pAether.id,
        milestoneId: mA2.id,
        title: "Design study enrollment progress dashboard",
        description: "Site-by-site recruitment velocity and screening drop-off breakdown.",
        stage: "backlog",
        priority: "low",
        assigneeName: "Elena Rostova",
        estimatedHours: 10,
        dueDate: "2026-12-15",
        attachmentName: "",
      },
      {
        projectId: pVeridian.id,
        milestoneId: mV1.id,
        title: "Post-launch handover playbook & monitoring runbook",
        description: "Delivered final runbooks and edge caching alerts to Veridian engineering team.",
        stage: "done",
        priority: "medium",
        assigneeName: "Morgan Ellis",
        dependsOnTaskId: tVeridianEdge.id,
        estimatedHours: 6,
        dueDate: "2026-10-29",
        attachmentName: "veridian-handover-playbook.pdf",
      },
    ])
    .returning();

  const [tHeliosGrid, tHeliosNav] = moreTasks;

  await db.insert(taskComments).values([
    {
      taskId: tHeliosApi.id,
      authorName: "Marcus Chen",
      body: "Currency bucket rollup is running at 84ms p95 against 2M synthetic ledger rows. Adding idempotency key checks next.",
    },
    {
      taskId: tHeliosApi.id,
      authorName: "Morgan Ellis",
      body: "Great pace — Devon is queued to connect the liquidity grid right after this endpoint merges.",
    },
    {
      taskId: tHeliosGrid.id,
      authorName: "Devon Brooks",
      body: "Mocked the 90-day scenario filters locally; waiting on the live treasury aggregation endpoint to clear the dependency.",
    },
    {
      taskId: tHeliosNav.id,
      authorName: "Elena Rostova",
      body: "Uploaded final keyboard focus rings and entity switcher hover specs for client sign-off.",
    },
    {
      taskId: tNorthstarSla.id,
      authorName: "Priya Nair",
      body: "Webhook HMAC signature verification is passing. Finalizing exponential backoff on 503 responses.",
    },
    {
      taskId: tAetherRbac.id,
      authorName: "Morgan Ellis",
      body: "Shared the RBAC matrix with Aether compliance counsel; expecting sign-off by Tuesday.",
    },
  ]);

  await db.insert(timeEntries).values([
    {
      projectId: pHelios.id,
      taskId: tHeliosTokens.id,
      memberName: "Elena Rostova",
      hours: 14,
      billable: true,
      note: "Design tokens, contrast audit, and component handoff",
      loggedDate: "2026-10-24",
    },
    {
      projectId: pHelios.id,
      taskId: tHeliosApi.id,
      memberName: "Marcus Chen",
      hours: 15.5,
      billable: true,
      note: "Treasury ledger SQL aggregation & streaming worker",
      loggedDate: "2026-11-18",
    },
    {
      projectId: pHelios.id,
      taskId: tHeliosNav.id,
      memberName: "Elena Rostova",
      hours: 7.5,
      billable: true,
      note: "Navigation rail polish and responsive spacing",
      loggedDate: "2026-11-19",
    },
    {
      projectId: pHelios.id,
      taskId: tHeliosGrid.id,
      memberName: "Devon Brooks",
      hours: 9,
      billable: true,
      note: "Liquidity grid virtualized table scaffolding",
      loggedDate: "2026-11-20",
    },
    {
      projectId: pHelios.id,
      taskId: null,
      memberName: "Morgan Ellis",
      hours: 6,
      billable: false,
      note: "Internal sprint planning & stakeholder steering prep",
      loggedDate: "2026-11-20",
    },
    {
      projectId: pNorthstar.id,
      taskId: tNorthstarBroker.id,
      memberName: "Marcus Chen",
      hours: 18,
      billable: true,
      note: "Regional telemetry consumer and dead-letter queue",
      loggedDate: "2026-11-04",
    },
    {
      projectId: pNorthstar.id,
      taskId: tNorthstarSla.id,
      memberName: "Priya Nair",
      hours: 14.5,
      billable: true,
      note: "SLA breach rule evaluator & signed webhooks",
      loggedDate: "2026-11-19",
    },
    {
      projectId: pNorthstar.id,
      taskId: null,
      memberName: "Devon Brooks",
      hours: 11,
      billable: true,
      note: "Exception triage drawer UI and filter states",
      loggedDate: "2026-11-20",
    },
    {
      projectId: pNorthstar.id,
      taskId: null,
      memberName: "Morgan Ellis",
      hours: 4.5,
      billable: true,
      note: "Risk mitigation workshop with Northstar VP Ops",
      loggedDate: "2026-11-21",
    },
    {
      projectId: pAether.id,
      taskId: tAetherRbac.id,
      memberName: "Priya Nair",
      hours: 11,
      billable: true,
      note: "HIPAA RBAC matrix & audit logging schema",
      loggedDate: "2026-11-18",
    },
    {
      projectId: pAether.id,
      taskId: null,
      memberName: "Elena Rostova",
      hours: 6.5,
      billable: false,
      note: "Internal design critique & clinical accessibility review",
      loggedDate: "2026-11-21",
    },
    {
      projectId: pVeridian.id,
      taskId: tVeridianEdge.id,
      memberName: "Devon Brooks",
      hours: 10,
      billable: true,
      note: "Edge storefront cutover & CWV verification",
      loggedDate: "2026-10-25",
    },
    {
      projectId: pVeridian.id,
      taskId: null,
      memberName: "Morgan Ellis",
      hours: 8,
      billable: true,
      note: "Launch handover & executive retrospective",
      loggedDate: "2026-10-29",
    },
  ]);

  await db.insert(activityLogs).values([
    {
      actorName: "Morgan Ellis",
      action: "logged_time",
      entityType: "time_entry",
      entityTitle: "4.5h on Northstar Logistics Telemetry API",
      projectId: pNorthstar.id,
      detail: "Billable risk mitigation workshop with Northstar VP Ops",
    },
    {
      actorName: "Elena Rostova",
      action: "moved_task",
      entityType: "task",
      entityTitle: "Executive navigation rail & account switcher polish",
      projectId: pHelios.id,
      detail: "Moved from In Progress to In Review",
    },
    {
      actorName: "Priya Nair",
      action: "commented",
      entityType: "task",
      entityTitle: "Build SLA breach detection rules & webhook dispatcher",
      projectId: pNorthstar.id,
      detail: "HMAC webhook signing verified; finalizing retry backoff",
    },
    {
      actorName: "Marcus Chen",
      action: "logged_time",
      entityType: "time_entry",
      entityTitle: "15.5h on Helios FinTech Core Redesign",
      projectId: pHelios.id,
      detail: "Treasury ledger aggregation & streaming worker",
    },
    {
      actorName: "Morgan Ellis",
      action: "completed_milestone",
      entityType: "milestone",
      entityTitle: "M1: Event Broker Schema & Ingest",
      projectId: pNorthstar.id,
      detail: "Milestone signed off by client engineering lead",
    },
    {
      actorName: "Morgan Ellis",
      action: "completed_milestone",
      entityType: "milestone",
      entityTitle: "M1: Edge Storefront Go-Live",
      projectId: pVeridian.id,
      detail: "Veridian Commerce launched ahead of budget",
    },
  ]);
}
