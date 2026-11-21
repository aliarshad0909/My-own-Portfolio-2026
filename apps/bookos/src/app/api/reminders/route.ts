import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bookings, customers, reminders, services, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [allReminders, allBookings, allServices, allStaff, allCustomers] = await Promise.all([
    db.select().from(reminders).orderBy(desc(reminders.scheduledForUtc)),
    db.select().from(bookings),
    db.select().from(services),
    db.select().from(staff),
    db.select().from(customers),
  ]);

  const bookingMap = new Map(allBookings.map((b) => [b.id, b]));
  const serviceMap = new Map(allServices.map((s) => [s.id, s]));
  const staffMap = new Map(allStaff.map((s) => [s.id, s]));
  const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

  const items = allReminders.map((r) => {
    const bk = bookingMap.get(r.bookingId);
    const svc = bk ? serviceMap.get(bk.serviceId) : undefined;
    const stf = bk ? staffMap.get(bk.staffId) : undefined;
    const cust = bk ? customerMap.get(bk.customerId) : undefined;
    return {
      id: r.id,
      bookingId: r.bookingId,
      bookingRef: bk?.bookingRef ?? "BK",
      bookingStartUtc: bk?.startUtc.toISOString() ?? null,
      channel: r.channel,
      scheduledForUtc: r.scheduledForUtc.toISOString(),
      status: r.status,
      message: r.message,
      serviceName: svc?.name ?? "Appointment",
      staffName: stf?.name ?? "Specialist",
      customerName: cust?.fullName ?? "Customer",
      customerEmail: cust?.email ?? "",
    };
  });

  return NextResponse.json({ reminders: items });
}
