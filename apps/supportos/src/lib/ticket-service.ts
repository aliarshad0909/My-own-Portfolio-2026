import { desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import {
  activityLogs,
  customers,
  kbArticles,
  ticketMessages,
  tickets,
  type TicketRow,
} from "@/db/schema";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/constants";
import {
  autoCategorizeTicket,
  calculateSlaDueAt,
  generateAiDraftSuggestion,
  type AiDraftResult,
} from "@/lib/support-engine";

export async function logActivity(
  db: AppDatabase,
  entry: {
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  },
): Promise<void> {
  await db.insert(activityLogs).values(entry);
}

/**
 * Atomically allocates the next sequential SUP-XXXX ticket number from the
 * PostgreSQL `supportos_ticket_seq` sequence so concurrent submissions never collide.
 */
export async function allocateTicketNumber(db: AppDatabase): Promise<string> {
  const result = await db.execute<{ next_num: string | number }>(
    sql`SELECT nextval('supportos_ticket_seq') AS next_num`,
  );
  const raw = result.rows[0]?.next_num;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Failed to allocate next ticket number from supportos_ticket_seq.");
  }
  return `SUP-${parsed}`;
}

export const generateNextTicketNumber = allocateTicketNumber;

export async function createTicketRecord(
  db: AppDatabase,
  input: {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerCompany?: string;
    subject: string;
    description: string;
    category?: TicketCategory | "auto";
    priority?: TicketPriority;
    assignedAgentName?: string | null;
    actorName: string;
    source?: "agent" | "portal";
  },
): Promise<{ ticket: TicketRow; customerName: string; customerEmail: string; customerCompany: string }> {
  let customerRecord = input.customerId
    ? (await db.select().from(customers).where(eq(customers.id, input.customerId)).limit(1))[0]
    : undefined;

  if (!customerRecord && input.customerEmail) {
    const normalizedEmail = input.customerEmail.trim().toLowerCase();
    customerRecord = (
      await db.select().from(customers).where(eq(customers.email, normalizedEmail)).limit(1)
    )[0];
    if (!customerRecord) {
      const [createdCustomer] = await db
        .insert(customers)
        .values({
          name: input.customerName?.trim() || normalizedEmail.split("@")[0] || "Portal Customer",
          email: normalizedEmail,
          company: input.customerCompany?.trim() || "Self-Service Account",
          planTier: "growth",
          notes: "Created automatically via Customer Portal submission.",
        })
        .onConflictDoNothing({ target: customers.email })
        .returning();
      customerRecord =
        createdCustomer ??
        (await db.select().from(customers).where(eq(customers.email, normalizedEmail)).limit(1))[0];
    }
  }

  if (!customerRecord) {
    throw new Error("A valid customerId or customerEmail is required to create a ticket.");
  }

  const resolvedCategory: TicketCategory =
    !input.category || input.category === "auto"
      ? autoCategorizeTicket(input.subject, input.description)
      : input.category;

  const priority: TicketPriority = input.priority ?? "medium";
  const now = new Date();
  const slaDueAt = calculateSlaDueAt(priority, now);
  const ticketNumber = await allocateTicketNumber(db);

  const [created] = await db
    .insert(tickets)
    .values({
      ticketNumber,
      customerId: customerRecord.id,
      subject: input.subject.trim(),
      description: input.description.trim(),
      category: resolvedCategory,
      priority,
      status: "open",
      assignedAgentName: input.assignedAgentName ?? null,
      slaDueAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(ticketMessages).values({
    ticketId: created.id,
    authorName: customerRecord.name,
    authorRole: "customer",
    isInternalNote: false,
    body: input.description.trim(),
    createdAt: now,
  });

  await logActivity(db, {
    actorName: input.source === "portal" ? customerRecord.name : input.actorName,
    action: input.source === "portal" ? "ticket.portal_submitted" : "ticket.created",
    entityType: "ticket",
    entityId: created.id,
    summary: `Created ${created.ticketNumber} (${resolvedCategory}, ${priority}) for ${customerRecord.company}: ${created.subject}`,
  });

  return {
    ticket: created,
    customerName: customerRecord.name,
    customerEmail: customerRecord.email,
    customerCompany: customerRecord.company,
  };
}

export async function updateTicketRecord(
  db: AppDatabase,
  ticketId: string,
  patch: {
    subject?: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    status?: TicketStatus;
    assignedAgentName?: string | null;
  },
  actorName: string,
): Promise<TicketRow | null> {
  const [existing] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!existing) return null;

  const now = new Date();
  const nextStatus = patch.status ?? (existing.status as TicketStatus);
  const nextPriority = patch.priority ?? (existing.priority as TicketPriority);

  let resolvedAt = existing.resolvedAt;
  if ((nextStatus === "resolved" || nextStatus === "closed") && !existing.resolvedAt) {
    resolvedAt = now;
  } else if (nextStatus !== "resolved" && nextStatus !== "closed") {
    resolvedAt = null;
  }

  let slaDueAt = existing.slaDueAt;
  if (patch.priority && patch.priority !== existing.priority && !existing.resolvedAt) {
    slaDueAt = calculateSlaDueAt(nextPriority, new Date(existing.createdAt));
  }

  const [updated] = await db
    .update(tickets)
    .set({
      subject: patch.subject ?? existing.subject,
      category: patch.category ?? existing.category,
      priority: nextPriority,
      status: nextStatus,
      assignedAgentName:
        patch.assignedAgentName !== undefined ? patch.assignedAgentName : existing.assignedAgentName,
      resolvedAt,
      slaDueAt,
      updatedAt: now,
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  const changes: string[] = [];
  if (patch.status && patch.status !== existing.status) changes.push(`status → ${patch.status}`);
  if (patch.priority && patch.priority !== existing.priority) changes.push(`priority → ${patch.priority}`);
  if (patch.category && patch.category !== existing.category) changes.push(`category → ${patch.category}`);
  if (
    patch.assignedAgentName !== undefined &&
    patch.assignedAgentName !== existing.assignedAgentName
  ) {
    changes.push(`assigned → ${patch.assignedAgentName || "Unassigned"}`);
  }

  if (changes.length > 0) {
    await logActivity(db, {
      actorName,
      action: nextStatus === "resolved" ? "ticket.resolved" : "ticket.updated",
      entityType: "ticket",
      entityId: updated.id,
      summary: `Updated ${updated.ticketNumber}: ${changes.join(", ")}`,
    });
  }

  return updated;
}

export async function postTicketMessage(
  db: AppDatabase,
  params: {
    ticketId: string;
    body: string;
    isInternalNote: boolean;
    authorRole: "agent" | "customer";
    authorName: string;
    nextStatus?: TicketStatus;
  },
) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, params.ticketId)).limit(1);
  if (!ticket) return null;

  // Customer messages can never be internal notes
  const isInternalNote = params.authorRole === "customer" ? false : params.isInternalNote;
  const now = new Date();

  const [message] = await db
    .insert(ticketMessages)
    .values({
      ticketId: ticket.id,
      authorName: params.authorName,
      authorRole: params.authorRole,
      isInternalNote,
      body: params.body.trim(),
      createdAt: now,
    })
    .returning();

  // Public agent reply sets first_responded_at if not already set; internal notes do NOT!
  const shouldSetFirstResponse =
    params.authorRole === "agent" && !isInternalNote && !ticket.firstRespondedAt;

  let nextStatus = params.nextStatus ?? (ticket.status as TicketStatus);
  if (!params.nextStatus) {
    if (params.authorRole === "agent" && !isInternalNote && ticket.status === "open") {
      nextStatus = "in_progress";
    } else if (params.authorRole === "customer" && ticket.status === "waiting_customer") {
      nextStatus = "open";
    }
  }

  let resolvedAt = ticket.resolvedAt;
  if ((nextStatus === "resolved" || nextStatus === "closed") && !resolvedAt) {
    resolvedAt = now;
  } else if (nextStatus !== "resolved" && nextStatus !== "closed") {
    resolvedAt = null;
  }

  const [updatedTicket] = await db
    .update(tickets)
    .set({
      firstRespondedAt: shouldSetFirstResponse ? now : ticket.firstRespondedAt,
      status: nextStatus,
      resolvedAt,
      updatedAt: now,
    })
    .where(eq(tickets.id, ticket.id))
    .returning();

  await logActivity(db, {
    actorName: params.authorName,
    action: isInternalNote ? "ticket.internal_note" : "ticket.replied",
    entityType: "ticket",
    entityId: ticket.id,
    summary: isInternalNote
      ? `Added internal note on ${ticket.ticketNumber}`
      : `Posted ${params.authorRole} reply on ${ticket.ticketNumber}`,
  });

  return { message, ticket: updatedTicket };
}

/**
 * Generates a read-only deterministic AI draft grounded in ticket details and KB articles.
 * Strictly NEVER persists a ticket_message or mutates ticket status.
 */
export async function buildTicketAiDraft(
  db: AppDatabase,
  ticketId: string,
): Promise<AiDraftResult | null> {
  const rows = await db
    .select({
      ticket: tickets,
      customer: customers,
    })
    .from(tickets)
    .innerJoin(customers, eq(tickets.customerId, customers.id))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (rows.length === 0) return null;
  const { ticket, customer } = rows[0];

  const messages = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(desc(ticketMessages.createdAt));

  const latestCustomerMsg = messages.find((m) => m.authorRole === "customer" && !m.isInternalNote);
  const allKb = await db.select().from(kbArticles);

  return generateAiDraftSuggestion({
    ticket,
    customerName: customer.name,
    customerCompany: customer.company,
    customerPlan: customer.planTier,
    latestCustomerMessage: latestCustomerMsg?.body,
    kbArticles: allKb,
  });
}
