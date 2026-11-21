import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers, ticketMessages, tickets } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { computeSlaStatus } from "@/lib/support-engine";
import { createTicketRecord } from "@/lib/ticket-service";
import { createTicketSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "").trim();
  const priority = (searchParams.get("priority") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const customerId = (searchParams.get("customerId") || "").trim();
  const customerEmail = (searchParams.get("customerEmail") || "").trim().toLowerCase();

  const db = await getDb();
  const [rows, messages] = await Promise.all([
    db
      .select({
        ticket: tickets,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          company: customers.company,
          planTier: customers.planTier,
        },
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .orderBy(desc(tickets.updatedAt)),
    db.select({ ticketId: ticketMessages.ticketId, isInternalNote: ticketMessages.isInternalNote }).from(ticketMessages),
  ]);

  const countMap = new Map<string, { total: number; internal: number }>();
  for (const m of messages) {
    const entry = countMap.get(m.ticketId) ?? { total: 0, internal: 0 };
    entry.total += 1;
    if (m.isInternalNote) entry.internal += 1;
    countMap.set(m.ticketId, entry);
  }

  const now = new Date();
  const filtered = rows
    .filter(({ ticket, customer }) => {
      if (status && status !== "all" && ticket.status !== status) return false;
      if (priority && priority !== "all" && ticket.priority !== priority) return false;
      if (category && category !== "all" && ticket.category !== category) return false;
      if (customerId && ticket.customerId !== customerId) return false;
      if (customerEmail && !customer.email.toLowerCase().includes(customerEmail)) return false;
      if (search) {
        const hay =
          `${ticket.ticketNumber} ${ticket.subject} ${ticket.description} ${customer.name} ${customer.company} ${customer.email} ${ticket.assignedAgentName ?? ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .map(({ ticket, customer }) => {
      const counts = countMap.get(ticket.id) ?? { total: 0, internal: 0 };
      return {
        ...ticket,
        customer,
        messageCount: counts.total,
        internalNoteCount: counts.internal,
        sla: computeSlaStatus(ticket, now),
      };
    });

  return NextResponse.json({ tickets: filtered });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "tickets:create"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Rate limit exceeded. Retry in ${limit.retryAfterSeconds}s.` }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid ticket payload." },
      { status: 400 },
    );
  }

  if (!parsed.data.customerId && !parsed.data.customerEmail) {
    return NextResponse.json(
      { error: "Select an existing customer or provide a customer email." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const result = await createTicketRecord(db, {
      ...parsed.data,
      actorName: auth.user.name,
    });
    return NextResponse.json(
      {
        ticket: {
          ...result.ticket,
          sla: computeSlaStatus(result.ticket),
        },
        customerName: result.customerName,
        customerEmail: result.customerEmail,
        customerCompany: result.customerCompany,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create ticket." },
      { status: 400 },
    );
  }
}
