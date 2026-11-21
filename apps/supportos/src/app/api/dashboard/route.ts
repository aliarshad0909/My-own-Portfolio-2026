import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, customers, kbArticles, ticketMessages, tickets } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { computeSlaStatus, computeSupportAnalytics } from "@/lib/support-engine";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [allTickets, allMessages, allKb, recentActivity, ticketCustomerRows] = await Promise.all([
    db.select().from(tickets).orderBy(desc(tickets.updatedAt)),
    db.select().from(ticketMessages),
    db.select().from(kbArticles),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10),
    db
      .select({
        ticket: tickets,
        customer: {
          id: customers.id,
          name: customers.name,
          company: customers.company,
          planTier: customers.planTier,
        },
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .orderBy(tickets.slaDueAt),
  ]);

  const now = new Date();
  const analytics = computeSupportAnalytics({
    tickets: allTickets,
    messages: allMessages,
    kbArticles: allKb,
    now,
  });

  const attentionQueue = ticketCustomerRows
    .filter(({ ticket }) => ticket.status !== "resolved" && ticket.status !== "closed")
    .map(({ ticket, customer }) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedAgentName: ticket.assignedAgentName,
      slaDueAt: ticket.slaDueAt,
      sla: computeSlaStatus(ticket, now),
      customer,
    }))
    .slice(0, 6);

  return NextResponse.json({
    analytics,
    attentionQueue,
    recentActivity,
  });
}
