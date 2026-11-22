import assert from "node:assert/strict";
import test from "node:test";
import { eq } from "drizzle-orm";

// Force isolated in-memory PostgreSQL (PGlite) for deterministic real SQL integration tests
process.env.DATABASE_URL = "";
process.env.SUPPORTOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { closeDbForTests, getDb, resetDemoWorkspace } from "../src/db";
import { kbArticles, ticketMessages, tickets } from "../src/db/schema";
import { computeSupportAnalytics } from "../src/lib/support-engine";
import {
  buildTicketAiDraft,
  createTicketRecord,
  postTicketMessage,
  updateTicketRecord,
} from "../src/lib/ticket-service";

test.after(async () => {
  await closeDbForTests();
});

test("full PostgreSQL ticket lifecycle: portal submit -> auto-categorize -> assign -> internal note -> AI draft (no auto-send) -> public reply -> resolve -> analytics -> demo reset", async () => {
  const db = await getDb();

  // Baseline seeded counts
  const initialTickets = await db.select().from(tickets);
  assert.equal(initialTickets.length, 10);

  // 1. Customer submits a ticket via Customer Portal with category="auto"
  const created = await createTicketRecord(db, {
    customerName: "Avery Stone",
    customerEmail: "avery@heliosdata.io",
    customerCompany: "Helios Data Corp",
    subject: "Duplicate credit card invoice charge on annual billing plan",
    description:
      "Our finance ledger shows two billing charges for invoice #INV-9910. Please issue a refund for the duplicate payment.",
    category: "auto",
    priority: "high",
    actorName: "Avery Stone",
    source: "portal",
  });

  assert.equal(created.ticket.category, "billing");
  assert.equal(created.ticket.status, "open");
  assert.equal(created.ticket.firstRespondedAt, null);
  assert.equal(created.ticket.resolvedAt, null);
  assert.ok(created.ticket.ticketNumber.startsWith("SUP-"));

  // SLA due should be 4 hours after creation for high priority
  const slaWindowMs =
    new Date(created.ticket.slaDueAt).getTime() - new Date(created.ticket.createdAt).getTime();
  assert.equal(slaWindowMs, 4 * 3_600_000);

  // 2. Assign ticket to an agent
  const assigned = await updateTicketRecord(
    db,
    created.ticket.id,
    { assignedAgentName: "Maya Lin (Lead Agent)" },
    "Maya Lin (Lead Agent)",
  );
  assert.ok(assigned);
  assert.equal(assigned.assignedAgentName, "Maya Lin (Lead Agent)");

  // 3. Add Internal Agent Note — must NOT set first_responded_at
  const noteResult = await postTicketMessage(db, {
    ticketId: created.ticket.id,
    body: "Internal check: verified duplicate Stripe charge in billing console.",
    isInternalNote: true,
    authorRole: "agent",
    authorName: "Maya Lin (Lead Agent)",
  });
  assert.ok(noteResult);
  assert.equal(noteResult.message.isInternalNote, true);
  assert.equal(noteResult.ticket.firstRespondedAt, null);

  // 4. Generate AI Draft Suggestion — grounded in KB articles and MUST NOT auto-send
  const beforeDraftMsgs = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, created.ticket.id));

  const aiDraft = await buildTicketAiDraft(db, created.ticket.id);
  assert.ok(aiDraft);
  assert.equal(aiDraft.autoSent, false);
  assert.ok(aiDraft.draft.includes("Hi Avery"));
  assert.ok(aiDraft.matchedArticles.length >= 1);

  const afterDraftMsgs = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, created.ticket.id));
  assert.equal(afterDraftMsgs.length, beforeDraftMsgs.length);

  const [afterDraftTicket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, created.ticket.id));
  assert.equal(afterDraftTicket.firstRespondedAt, null);

  // 5. Agent edits & sends Public Customer Reply — MUST set first_responded_at
  const replyResult = await postTicketMessage(db, {
    ticketId: created.ticket.id,
    body: `${aiDraft.draft}\n\nRefund ID: ref_9910_confirmed.`,
    isInternalNote: false,
    authorRole: "agent",
    authorName: "Maya Lin (Lead Agent)",
  });
  assert.ok(replyResult);
  assert.equal(replyResult.message.isInternalNote, false);
  assert.ok(replyResult.ticket.firstRespondedAt instanceof Date);
  assert.equal(replyResult.ticket.status, "in_progress");

  // 6. Resolve ticket — sets resolved_at
  const resolved = await updateTicketRecord(
    db,
    created.ticket.id,
    { status: "resolved" },
    "Maya Lin (Lead Agent)",
  );
  assert.ok(resolved);
  assert.equal(resolved.status, "resolved");
  assert.ok(resolved.resolvedAt instanceof Date);

  // 7. Verify SLA & Agent Analytics reflect the new resolved ticket
  const [allTickets, allMessages, allKb] = await Promise.all([
    db.select().from(tickets),
    db.select().from(ticketMessages),
    db.select().from(kbArticles),
  ]);
  const analytics = computeSupportAnalytics({
    tickets: allTickets,
    messages: allMessages,
    kbArticles: allKb,
  });
  assert.equal(analytics.kpis.totalTickets, 11);
  assert.ok(analytics.kpis.resolvedTickets >= 5);
  assert.ok(analytics.kpis.avgFirstResponseMinutes >= 1);
  const mayaStats = analytics.agentPerformance.find((a) => a.agentName === "Maya Lin (Lead Agent)");
  assert.ok(mayaStats);
  assert.ok(mayaStats.internalNotesCount >= 2);

  // 8. Verify Demo Reset restores exact seeded state cleanly
  await resetDemoWorkspace();
  const resetTickets = await db.select().from(tickets);
  assert.equal(resetTickets.length, 10);
  const removedPortalTicket = resetTickets.find((t) => t.id === created.ticket.id);
  assert.equal(removedPortalTicket, undefined);
});

test("concurrent ticket creation via PostgreSQL sequence produces strictly unique sequential SUP-XXXX numbers with zero collisions", async () => {
  const db = await getDb();
  await resetDemoWorkspace();

  const existingTickets = await db.select({ ticketNumber: tickets.ticketNumber }).from(tickets);
  const existingNumbers = new Set(existingTickets.map((t) => t.ticketNumber));

  const batchSize = 14;
  const results = await Promise.all(
    Array.from({ length: batchSize }, (_, idx) =>
      createTicketRecord(db, {
        customerName: `Concurrent Customer ${idx + 1}`,
        customerEmail: `concurrent-shared@acme-cloud.io`,
        customerCompany: "Acme Concurrency Labs",
        subject: `Concurrent submission #${idx + 1} webhook timeout`,
        description: `Simultaneous portal ticket payload #${idx + 1} verifying atomic sequence allocation.`,
        category: "technical",
        priority: "medium",
        actorName: "Concurrent Portal",
        source: "portal",
      }),
    ),
  );

  assert.equal(results.length, batchSize);

  const allocatedNumbers = results.map((r) => r.ticket.ticketNumber);
  const uniqueNumbers = new Set(allocatedNumbers);
  assert.equal(uniqueNumbers.size, batchSize, "All concurrent tickets must get unique numbers");

  const numericValues = allocatedNumbers
    .map((num) => {
      assert.match(num, /^SUP-\d+$/);
      assert.equal(existingNumbers.has(num), false, `Must not collide with seeded ${num}`);
      return Number.parseInt(num.slice(4), 10);
    })
    .sort((a, b) => a - b);

  // Verify strictly contiguous sequential integers (each +1 from the previous)
  for (let i = 1; i < numericValues.length; i += 1) {
    assert.equal(
      numericValues[i],
      numericValues[i - 1] + 1,
      `Expected sequential ticket numbers, got ${numericValues.join(", ")}`,
    );
  }

  // Verify resetDemoWorkspace keeps the sequence synchronized >= seeded max (1010)
  await resetDemoWorkspace();
  const postReset = await createTicketRecord(db, {
    customerName: "Post Reset User",
    customerEmail: "post-reset@acme-cloud.io",
    customerCompany: "Acme Cloud Systems",
    subject: "Post-reset sequence verification ticket",
    description: "Verifies nextval continues cleanly above seeded SUP-1010 after demo reset.",
    category: "technical",
    priority: "low",
    actorName: "Post Reset User",
    source: "portal",
  });
  const postResetNum = Number.parseInt(postReset.ticket.ticketNumber.slice(4), 10);
  assert.ok(postResetNum > 1010, `Expected ticket number > 1010, got ${postReset.ticket.ticketNumber}`);
});
