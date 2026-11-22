import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bookings, customers, reminders, services, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  BookingValidationError,
  SlotConflictError,
  createBookingAtomic,
} from "@/lib/scheduling";
import { verifyCsrfOrigin } from "@/lib/security";
import { createBookingSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const staffId = url.searchParams.get("staffId") || "";
  const status = url.searchParams.get("status") || "";
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();

  const db = await getDb();
  const [allBookings, allServices, allStaff, allCustomers, allReminders] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.startUtc)),
    db.select().from(services),
    db.select().from(staff),
    db.select().from(customers),
    db.select().from(reminders).orderBy(reminders.scheduledForUtc),
  ]);

  const serviceMap = new Map(allServices.map((s) => [s.id, s]));
  const staffMap = new Map(allStaff.map((s) => [s.id, s]));
  const customerMap = new Map(allCustomers.map((c) => [c.id, c]));
  const reminderMap = new Map<string, typeof allReminders>();
  for (const r of allReminders) {
    const list = reminderMap.get(r.bookingId) ?? [];
    list.push(r);
    reminderMap.set(r.bookingId, list);
  }

  const enriched = allBookings
    .map((b) => {
      const svc = serviceMap.get(b.serviceId);
      const stf = staffMap.get(b.staffId);
      const cust = customerMap.get(b.customerId);
      return {
        id: b.id,
        bookingRef: b.bookingRef,
        serviceId: b.serviceId,
        serviceName: svc?.name ?? "Service",
        serviceCategory: svc?.category ?? "",
        durationMins: svc?.durationMins ?? 45,
        bufferMins: svc?.bufferMins ?? 10,
        staffId: b.staffId,
        staffName: stf?.name ?? "Specialist",
        staffRoleTitle: stf?.roleTitle ?? "",
        staffTimezone: stf?.timezone ?? "America/New_York",
        staffAvatarColor: stf?.avatarColor ?? "#2563eb",
        customerId: b.customerId,
        customerName: cust?.fullName ?? "Customer",
        customerEmail: cust?.email ?? "",
        customerPhone: cust?.phone ?? "",
        startUtc: b.startUtc.toISOString(),
        endUtc: b.endUtc.toISOString(),
        customerTimezone: b.customerTimezone,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentAmountCents: b.paymentAmountCents,
        paymentReceiptRef: b.paymentReceiptRef,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        reminders: (reminderMap.get(b.id) ?? []).map((r) => ({
          id: r.id,
          channel: r.channel,
          scheduledForUtc: r.scheduledForUtc.toISOString(),
          status: r.status,
          message: r.message,
        })),
      };
    })
    .filter((item) => {
      if (staffId && staffId !== "all" && item.staffId !== staffId) return false;
      if (status && status !== "all" && item.status !== status) return false;
      if (search) {
        const hay =
          `${item.bookingRef} ${item.customerName} ${item.customerEmail} ${item.serviceName} ${item.staffName}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

  return NextResponse.json({ bookings: enriched });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "create-booking"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking payload." },
      { status: 400 },
    );
  }

  try {
    const result = await createBookingAtomic({
      serviceId: parsed.data.serviceId,
      staffId: parsed.data.staffId,
      startUtc: new Date(parsed.data.startUtc),
      customerTimezone: parsed.data.customerTimezone,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      notes: parsed.data.notes,
      simulateSandboxPayment: parsed.data.simulateSandboxPayment,
      actorName: auth.user.name,
    });

    return NextResponse.json(
      {
        booking: {
          ...result.booking,
          startUtc: result.booking.startUtc.toISOString(),
          endUtc: result.booking.endUtc.toISOString(),
          serviceName: result.service.name,
          durationMins: result.service.durationMins,
          staffName: result.staff.name,
          staffTimezone: result.staff.timezone,
          customerName: result.customer.fullName,
          customerEmail: result.customer.email,
        },
        reminders: result.reminders.map((r) => ({
          id: r.id,
          channel: r.channel,
          scheduledForUtc: r.scheduledForUtc.toISOString(),
          status: r.status,
          message: r.message,
        })),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SlotConflictError) {
      return NextResponse.json({ error: err.message, code: "SLOT_CONFLICT" }, { status: 409 });
    }
    if (err instanceof BookingValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create booking." },
      { status: 500 },
    );
  }
}
