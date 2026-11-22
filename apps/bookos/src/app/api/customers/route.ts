import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, bookings, customers, services, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { customerCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();

  const db = await getDb();
  const [allCustomers, allBookings, allServices, allStaff] = await Promise.all([
    db.select().from(customers).orderBy(desc(customers.createdAt)),
    db.select().from(bookings).orderBy(desc(bookings.startUtc)),
    db.select().from(services),
    db.select().from(staff),
  ]);

  const serviceMap = new Map(allServices.map((s) => [s.id, s]));
  const staffMap = new Map(allStaff.map((s) => [s.id, s]));

  const bookingsByCustomer = new Map<string, typeof allBookings>();
  for (const b of allBookings) {
    const list = bookingsByCustomer.get(b.customerId) ?? [];
    list.push(b);
    bookingsByCustomer.set(b.customerId, list);
  }

  const now = new Date();

  const directory = allCustomers
    .map((cust) => {
      const custBookings = bookingsByCustomer.get(cust.id) ?? [];
      const upcomingCount = custBookings.filter(
        (b) => (b.status === "confirmed" || b.status === "rescheduled") && b.startUtc >= now,
      ).length;
      const completedCount = custBookings.filter((b) => b.status === "completed").length;
      const cancelledCount = custBookings.filter((b) => b.status === "cancelled").length;
      const lifetimeSandboxSpendCents = custBookings
        .filter((b) => b.paymentStatus === "sandbox_paid")
        .reduce((sum, b) => sum + b.paymentAmountCents, 0);

      return {
        id: cust.id,
        fullName: cust.fullName,
        email: cust.email,
        phone: cust.phone,
        timezone: cust.timezone,
        notes: cust.notes,
        createdAt: cust.createdAt.toISOString(),
        stats: {
          totalBookings: custBookings.length,
          upcomingCount,
          completedCount,
          cancelledCount,
          lifetimeSandboxSpendCents,
        },
        bookings: custBookings.map((b) => ({
          id: b.id,
          bookingRef: b.bookingRef,
          serviceName: serviceMap.get(b.serviceId)?.name ?? "Service",
          durationMins: serviceMap.get(b.serviceId)?.durationMins ?? 45,
          staffName: staffMap.get(b.staffId)?.name ?? "Specialist",
          startUtc: b.startUtc.toISOString(),
          endUtc: b.endUtc.toISOString(),
          customerTimezone: b.customerTimezone,
          status: b.status,
          paymentStatus: b.paymentStatus,
          paymentAmountCents: b.paymentAmountCents,
          paymentReceiptRef: b.paymentReceiptRef,
          notes: b.notes,
        })),
      };
    })
    .filter((c) => {
      if (!search) return true;
      return `${c.fullName} ${c.email} ${c.phone} ${c.timezone}`.toLowerCase().includes(search);
    });

  return NextResponse.json({ customers: directory });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "customers-write"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = customerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid customer payload." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A customer with this email already exists." },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(customers)
    .values({
      ...parsed.data,
      email,
    })
    .returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "customer.created",
    entityType: "customer",
    entityId: created.id,
    summary: `Added customer ${created.fullName} (${created.email}).`,
  });

  return NextResponse.json({ customer: created }, { status: 201 });
}
