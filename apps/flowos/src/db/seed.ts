import type { FlowOsDb } from "@/db";
import { integrations, runSteps, users, workflowRuns, workflows } from "@/db/schema";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";
import { executeWorkflow, resolveApproval } from "@/lib/engine";
import { WORKFLOW_TEMPLATES } from "@/lib/templates-data";

export async function seedFlowOsDemo(
  db: FlowOsDb,
  options: { skipUsers?: boolean; usersOnly?: boolean } = {},
) {
  let demoUserId: string | null = null;

  if (!options.skipUsers) {
    const [demoUser] = await db
      .insert(users)
      .values({
        email: DEMO_ACCOUNT.email,
        name: DEMO_ACCOUNT.name,
        role: DEMO_ACCOUNT.role,
        passwordHash: hashPassword(DEMO_ACCOUNT.password),
      })
      .onConflictDoNothing()
      .returning();

    demoUserId = demoUser?.id ?? null;

    // Seed a non-interactive staff record with an unguessable locked password
    await db
      .insert(users)
      .values({
        email: "controller@flowos.studio",
        name: "Marcus Thorne (Finance Controller)",
        role: "operator",
        passwordHash: hashPassword(generateLockedPassword()),
      })
      .onConflictDoNothing();
  }

  if (options.usersOnly) return;

  // 1. Seed 4 workflow templates (isTemplate = true)
  for (const tpl of WORKFLOW_TEMPLATES) {
    await db.insert(workflows).values({
      slug: `tpl-${tpl.slug}`,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      triggerType: tpl.triggerType,
      active: true,
      isTemplate: true,
      nodesJson: tpl.nodes,
      edgesJson: tpl.edges,
      samplePayload: tpl.samplePayload,
      createdBy: demoUserId,
    });
  }

  // 2. Seed 4 active workspace workflows cloned from the templates
  const activeWorkflows: Array<{ id: string; slug: string; name: string }> = [];
  for (const tpl of WORKFLOW_TEMPLATES) {
    const [created] = await db
      .insert(workflows)
      .values({
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        triggerType: tpl.triggerType,
        active: true,
        isTemplate: false,
        nodesJson: tpl.nodes,
        edgesJson: tpl.edges,
        samplePayload: tpl.samplePayload,
        createdBy: demoUserId,
      })
      .returning();
    activeWorkflows.push({ id: created.id, slug: created.slug, name: created.name });
  }

  // 3. Seed 4 realistic integrations
  await db.insert(integrations).values([
    {
      name: "FlowOS Deterministic AI Engine",
      kind: "ai_deterministic",
      endpointUrl: "internal://deterministic-ai/v1",
      enabled: true,
      description:
        "Built-in zero-key scoring, sentiment classification, and structured drafting engine. Runs offline with reproducible outputs.",
      configJson: {
        mode: "deterministic",
        requiresApiKey: false,
        optionalLiveLlmEnv: "OPENAI_API_KEY",
        supportedTasks: ["lead_scoring", "ticket_triage", "invoice_escalation", "inventory_analysis"],
      },
      lastTestedAt: new Date(Date.now() - 1000 * 60 * 18),
      lastStatus: "healthy",
    },
    {
      name: "Inbound Webhook Gateway",
      kind: "webhook",
      endpointUrl: "https://hooks.flowos.studio/v1/inbound",
      enabled: true,
      description:
        "HMAC-signed JSON webhook receiver for helpdesk tickets, CRM form fills, and billing events.",
      configJson: {
        signatureHeader: "x-flowos-signature",
        maxPayloadKb: 256,
        replayProtectionSeconds: 300,
      },
      lastTestedAt: new Date(Date.now() - 1000 * 60 * 42),
      lastStatus: "healthy",
    },
    {
      name: "n8n Optional Webhook Bridge",
      kind: "n8n",
      endpointUrl: "https://n8n.example.com/webhook/flowos-bridge",
      enabled: false,
      description:
        "Optional bridge to forward human-approved FlowOS payloads into self-hosted n8n workflows.",
      configJson: {
        authMode: "header_token",
        sandboxOnly: true,
        timeoutMs: 8000,
      },
      lastTestedAt: null,
      lastStatus: "standby",
    },
    {
      name: "Sandbox HTTP Dispatch Gateway",
      kind: "http",
      endpointUrl: "https://hooks.flowos.studio/sandbox/dispatch",
      enabled: true,
      description:
        "Dry-run HTTP action executor with SSRF filtering and mandatory human approval verification.",
      configJson: {
        dryRunDefault: true,
        ssrfProtection: true,
        blockPrivateNetworks: true,
      },
      lastTestedAt: new Date(Date.now() - 1000 * 60 * 7),
      lastStatus: "healthy",
    },
  ]);

  // 4. Execute realistic runs using the real deterministic engine so traces are 100% genuine!
  const leadWf = activeWorkflows.find((w) => w.slug === "inbound-lead-qualification");
  const stockWf = activeWorkflows.find((w) => w.slug === "low-stock-reorder-alert");
  const ticketWf = activeWorkflows.find((w) => w.slug === "support-ticket-ai-triage");
  const invoiceWf = activeWorkflows.find((w) => w.slug === "overdue-invoice-escalation");

  if (leadWf) {
    // Run 1: Completed (approved & resumed)
    const r1 = await executeWorkflow(
      leadWf.id,
      {
        leadName: "Devon Park",
        email: "devon@heliosgrid.example",
        company: "Helios Grid Analytics",
        employees: 320,
        budgetUsd: 62000,
        source: "enterprise_contact",
        message: "We need workflow automation with audit trails and approval gates for 4 ops squads.",
      },
      { db },
    );
    await resolveApproval(r1.run.id, "approve", DEMO_ACCOUNT.name, "Verified enterprise fit — approved CRM sync.", {
      db,
    });

    // Run 2: Currently awaiting human approval!
    await executeWorkflow(
      leadWf.id,
      {
        leadName: "Elena Rostova",
        email: "elena@vertexcloud.io",
        company: "Vertex Cloud Systems",
        employees: 240,
        budgetUsd: 48000,
        source: "pricing_page",
        message: "Looking to automate 12 internal ops workflows with audit logs and approval gates.",
      },
      { db },
    );
  }

  if (ticketWf) {
    // Run 3: Support ticket awaiting human approval!
    await executeWorkflow(
      ticketWf.id,
      {
        ticketId: "SUP-8841",
        customer: "Meridian Health",
        contactEmail: "devops@meridianhealth.example",
        plan: "Enterprise",
        subject: "Production webhook latency spike after certificate rotation",
        body: "Urgent: our EU webhook workers started seeing 502 timeouts 15 minutes ago after TLS rotation.",
      },
      { db },
    );
  }

  if (stockWf) {
    // Run 4: Low-stock completed
    const r4 = await executeWorkflow(
      stockWf.id,
      {
        sku: "SF-MTR-402",
        productName: "Brushless Actuator Module v3",
        warehouse: "Austin Hub A",
        stockQty: 14,
        reorderPoint: 30,
        unitCostUsd: 86,
        supplierEmail: "orders@nordicmotion.example",
      },
      { db },
    );
    await resolveApproval(r4.run.id, "approve", DEMO_ACCOUNT.name, "Approved PO batch #402.", { db });
  }

  if (invoiceWf) {
    // Run 5: Failed downstream HTTP dispatch (ready for one-click Retry!)
    const r5 = await executeWorkflow(
      invoiceWf.id,
      {
        invoiceNumber: "INV-2026-0918",
        accountName: "Kestrel Logistics Ltd",
        billingEmail: "ap@kestrellogistics.example",
        amountUsd: 18450,
        daysOverdue: 22,
        accountOwner: "Maya Chen",
        _simulateHttpFailure: true,
      },
      { db },
    );
    await resolveApproval(
      r5.run.id,
      "approve",
      "Marcus Thorne (Finance Controller)",
      "Confirmed unpaid in ledger — proceed with notice.",
      { db },
    );

    // Run 6: Completed invoice below threshold (condition false -> cleanly skipped)
    await executeWorkflow(
      invoiceWf.id,
      {
        invoiceNumber: "INV-2026-0944",
        accountName: "Northwind Robotics",
        billingEmail: "finance@northwind.example",
        amountUsd: 9200,
        daysOverdue: 6,
        accountOwner: "Maya Chen",
      },
      { db },
    );
  }

  // Spread historical timestamps slightly for richer 7-day analytics chart while preserving order
  const allRuns = await db.select().from(workflowRuns);
  const offsetsHours = [96, 72, 48, 28, 6, 1];
  for (let i = 0; i < allRuns.length; i++) {
    const run = allRuns[i];
    const hrs = offsetsHours[i % offsetsHours.length];
    const shifted = new Date(Date.now() - hrs * 3600_000);
    await db
      .update(workflowRuns)
      .set({
        startedAt: shifted,
        completedAt: run.completedAt ? new Date(shifted.getTime() + Math.max(40, run.durationMs)) : null,
      })
      .where(
        (await import("drizzle-orm")).eq(workflowRuns.id, run.id),
      );
  }

  // Silence unused import warning if runSteps only needed for type integrity
  void runSteps;
}
