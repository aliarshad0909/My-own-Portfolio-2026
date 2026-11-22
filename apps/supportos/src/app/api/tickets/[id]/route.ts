import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers, ticketMessages, tickets } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { computeSlaStatus } from "@/lib/support-engine";
import { logActivity, updateTicketRecord } from "@/lib/ticket-service";
import { updateTicketSchema } from "@/lib/validation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ticket ID." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("publicOnly") === "true";

  const db = await getDb();
  const rows = await db
    .select({
      ticket: tickets,
      customer: customers,
    })
    .from(tickets)
    .innerJoin(customers, eq(tickets.customerId, customers.id))
    .where(eq(tickets.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const allMessages = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(asc(ticketMessages.createdAt));

  const visibleMessages = publicOnly
    ? allMessages.filter((m) => !m.isInternalNote)
    : allMessages;

  const { ticket, customer } = rows[0];
  return NextResponse.json({
    ticket: {
      ...ticket,
      customer,
      sla: computeSlaStatus(ticket),
    },
    messages: visibleMessages,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "tickets:update"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ticket ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid ticket update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const updated = await updateTicketRecord(db, id, parsed.data, auth.user.name);
  if (!updated) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json({
    ticket: {
      ...updated,
      sla: computeSlaStatus(updated),
    },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ticket ID." }, { status: 400 });
  }

  const db = await getDb();
  const [deleted] = await db.delete(tickets).where(eq(tickets.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  await logActivity(db, {
    actorName: auth.user.name,
    action: "ticket.deleted",
    entityType: "ticket",
    entityId: deleted.id,
    summary: `Deleted ticket ${deleted.ticketNumber} (${deleted.subject})`,
  });

  return NextResponse.json({ ok: true });
}
