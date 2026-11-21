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
