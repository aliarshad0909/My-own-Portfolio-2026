import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  activityLogs,
  bookings,
  customers,
  reminders,
  services,
  staff,
} from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { getDateKeyInTimezone } from "@/lib/timezone";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const timezone = url.searchParams.get("timezone") || "America/New_York";

  const db = await getDb();
  const [allBookings, allServices, allStaff, allCustomers, allReminders, recentLogs] =
    await Promise.all([
      db.select().from(bookings).orderBy(bookings.startUtc),
      db.select().from(services),
      db.select().from(staff),
      db.select().from(customers),
      db.select().from(reminders),
      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10),
    ]);

  const serviceMap = new Map(allServices.map((s) => [s.id, s]));
  const staffMap = new Map(allStaff.map((s) => [s.id, s]));
  const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

  const now = new Date();
  let todayKey = getDateKeyInTimezone(now, "America/New_York");
  try {
    todayKey = getDateKeyInTimezone(now, timezone);
  } catch {
    // Fallback already set
  }

  const upcomingConfirmed = allBookings.filter(
    (b) => (b.status === "confirmed" || b.status === "rescheduled") && b.startUtc >= new Date(now.getTime() - 3 * 3600_000),
  );

  const todaysSchedule = allBookings.filter((b) => {
    if (b.status === "cancelled") return false;
    try {
      return getDateKeyInTimezone(b.startUtc, timezone) === todayKey;
    } catch {
      return false;
    }
  });

  const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;
  const cancellationRate =
    allBookings.length > 0 ? Math.round((cancelledCount / allBookings.length) * 1000) / 10 : 0;

  const simulatedSandboxRevenueCents = allBookings
    .filter((b) => b.paymentStatus === "sandbox_paid")
    .reduce((sum, b) => sum + b.paymentAmountCents, 0);

  const scheduledRemindersCount = allReminders.filter((r) => r.status === "scheduled").length;

  // Analytics by Service
  const byService = allServices.map((svc) => {
    const svcBookings = allBookings.filter((b) => b.serviceId === svc.id);
    const activeCount = svcBookings.filter((b) => b.status !== "cancelled").length;
    const revenueCents = svcBookings
      .filter((b) => b.paymentStatus === "sandbox_paid")
      .reduce((acc, b) => acc + b.paymentAmountCents, 0);
    return {
      id: svc.id,
      name: svc.name,
      category: svc.category,
      durationMins: svc.durationMins,
      totalBookings: svcBookings.length,
      activeBookings: activeCount,
      revenueCents,
    };
  }).sort((a, b) => b.activeBookings - a.activeBookings);

  // Analytics by Staff
  const byStaff = allStaff.map((member) => {
    const memberBookings = allBookings.filter((b) => b.staffId === member.id);
    const activeCount = memberBookings.filter((b) => b.status !== "cancelled").length;
    const revenueCents = memberBookings
      .filter((b) => b.paymentStatus === "sandbox_paid")
      .reduce((acc, b) => acc + b.paymentAmountCents, 0);
    return {
      id: member.id,
      name: member.name,
      roleTitle: member.roleTitle,
      timezone: member.timezone,
      avatarColor: member.avatarColor,
      activeBookings: activeCount,
      revenueCents,
    };
  }).sort((a, b) => b.activeBookings - a.activeBookings);

  const upcomingList = upcomingConfirmed.slice(0, 8).map((b) => ({
    id: b.id,
    bookingRef: b.bookingRef,
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString(),
    customerTimezone: b.customerTimezone,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentAmountCents: b.paymentAmountCents,
    paymentReceiptRef: b.paymentReceiptRef,
    serviceName: serviceMap.get(b.serviceId)?.name ?? "Service",
    durationMins: serviceMap.get(b.serviceId)?.durationMins ?? 45,
    staffName: staffMap.get(b.staffId)?.name ?? "Specialist",
    staffAvatarColor: staffMap.get(b.staffId)?.avatarColor ?? "#2563eb",
    customerName: customerMap.get(b.customerId)?.fullName ?? "Customer",
    customerEmail: customerMap.get(b.customerId)?.email ?? "",
  }));

  return NextResponse.json({
    kpis: {
      upcomingConfirmedCount: upcomingConfirmed.length,
      todaysScheduleCount: todaysSchedule.length,
      cancellationRate,
      simulatedSandboxRevenueCents,
      scheduledRemindersCount,
      totalBookings: allBookings.length,
      totalCustomers: allCustomers.length,
    },
    upcomingBookings: upcomingList,
    analytics: {
      byService,
      byStaff,
    },
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      actorName: l.actorName,
      action: l.action,
      entityId: l.entityId,
      summary: l.summary,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
