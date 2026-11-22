import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers, tickets } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { logActivity } from "@/lib/ticket-service";
import { createCustomerSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const planTier = (searchParams.get("planTier") || "").trim();

  const db = await getDb();
  const [allCustomers, allTickets] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.name)),
    db.select({ customerId: tickets.customerId, status: tickets.status }).from(tickets),
  ]);

  const ticketCounts = new Map<string, { open: number; resolved: number; total: number }>();
  for (const t of allTickets) {
    const entry = ticketCounts.get(t.customerId) ?? { open: 0, resolved: 0, total: 0 };
    entry.total += 1;
    if (t.status === "resolved" || t.status === "closed") {
      entry.resolved += 1;
    } else {
      entry.open += 1;
    }
    ticketCounts.set(t.customerId, entry);
  }

  const filtered = allCustomers
    .filter((c) => {
      if (planTier && planTier !== "all" && c.planTier !== planTier) return false;
      if (search) {
        const hay = `${c.name} ${c.email} ${c.company} ${c.notes}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .map((c) => {
      const stats = ticketCounts.get(c.id) ?? { open: 0, resolved: 0, total: 0 };
      return {
        ...c,
        openTicketCount: stats.open,
        resolvedTicketCount: stats.resolved,
        totalTicketCount: stats.total,
      };
    });

  return NextResponse.json({ customers: filtered });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "customers:create"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid customer payload." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const [created] = await db
      .insert(customers)
      .values({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        company: parsed.data.company,
        planTier: parsed.data.planTier,
        notes: parsed.data.notes ?? "",
      })
      .returning();

    await logActivity(db, {
      actorName: auth.user.name,
      action: "customer.created",
      entityType: "customer",
      entityId: created.id,
      summary: `Added customer ${created.name} (${created.company}, ${created.planTier})`,
    });

    return NextResponse.json(
      {
        customer: {
          ...created,
          openTicketCount: 0,
          resolvedTicketCount: 0,
          totalTicketCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error && err.message.toLowerCase().includes("unique")
      ? "A customer with this email already exists."
      : "Unable to create customer.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
