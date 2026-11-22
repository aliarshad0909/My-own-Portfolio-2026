import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import {
  activityLogs,
  availabilityRules,
  bookings,
  customers,
  reminders,
  services,
  staff,
  users,
} from "@/db/schema";
import {
  DEMO_ACCOUNT,
  generateLockedPassword,
  hashPassword,
} from "@/lib/crypto";
import {
  addDaysToDateKey,
  getDateKeyInTimezone,
  getDayOfWeekForDateKey,
  zonedWallTimeToUtc,
} from "@/lib/timezone";

function nextWeekdayFrom(baseDateKey: string, minOffsetDays: number): string {
  let candidate = addDaysToDateKey(baseDateKey, minOffsetDays);
  for (let i = 0; i < 7; i++) {
    const dow = getDayOfWeekForDateKey(candidate);
    if (dow >= 1 && dow <= 5) return candidate;
    candidate = addDaysToDateKey(candidate, 1);
  }
  return candidate;
}

function prevWeekdayFrom(baseDateKey: string, minOffsetDays: number): string {
  let candidate = addDaysToDateKey(baseDateKey, -minOffsetDays);
  for (let i = 0; i < 7; i++) {
    const dow = getDayOfWeekForDateKey(candidate);
    if (dow >= 1 && dow <= 5) return candidate;
    candidate = addDaysToDateKey(candidate, -1);
  }
  return candidate;
}

export async function seedDemoData(
  db: AppDatabase,
  options: { skipUsers?: boolean; usersOnly?: boolean } = {},
): Promise<void> {
  if (!options.skipUsers) {
    const existingAdmin = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          role: DEMO_ACCOUNT.role,
          avatarColor: "#2563eb",
        },
        {
          email: "marcus@bookos.studio",
          name: "Marcus Vance",
          passwordHash: hashPassword(generateLockedPassword()),
          role: "staff",
          avatarColor: "#0f766e",
        },
        {
          email: "nadia@bookos.studio",
          name: "Nadia Al-Mansoor",
          passwordHash: hashPassword(generateLockedPassword()),
          role: "staff",
          avatarColor: "#4f46e5",
        },
      ]);
    }
  }

  if (options.usersOnly) return;

  const insertedServices = await db
    .insert(services)
    .values([
      {
        name: "Executive Strategy Consultation",
        slug: "executive-strategy-consultation",
        category: "Strategy & Advisory",
        durationMins: 45,
        bufferMins: 15,
        priceCents: 18000,
        currency: "USD",
        description: "Focused 1-on-1 advisory session covering roadmap prioritization, market positioning, and quarterly milestones.",
        active: true,
      },
      {
        name: "Product Architecture Review",
        slug: "product-architecture-review",
        category: "Design & Architecture",
        durationMins: 60,
        bufferMins: 15,
        priceCents: 26000,
        currency: "USD",
        description: "Deep-dive system review of your SaaS architecture, API contracts, performance bottlenecks, and scalability plan.",
        active: true,
      },
      {
        name: "Design System & UX Audit",
        slug: "design-system-ux-audit",
        category: "Design & Architecture",
        durationMins: 45,
        bufferMins: 15,
        priceCents: 21000,
        currency: "USD",
        description: "Comprehensive walkthrough of your customer journeys, accessibility ergonomics, and component hierarchy.",
        active: true,
      },
      {
        name: "Discovery & Intake Briefing",
        slug: "discovery-intake-briefing",
        category: "Executive Coaching",
        durationMins: 30,
        bufferMins: 10,
        priceCents: 9500,
        currency: "USD",
        description: "Crisp introductory alignment call to scope deliverables, timelines, and specialist fit before engagement.",
        active: true,
      },
      {
        name: "Technical Security & Readiness Clinic",
        slug: "technical-security-readiness",
        category: "Technical Audit",
        durationMins: 90,
        bufferMins: 15,
        priceCents: 39000,
        currency: "USD",
        description: "Pre-launch readiness audit spanning authentication, data isolation, deployment hardening, and observability.",
        active: true,
      },
    ])
    .returning();

  const [svcStrategy, svcArch, svcUx, svcDiscovery, svcSecurity] = insertedServices;

  const insertedStaff = await db
    .insert(staff)
    .values([
      {
        name: "Elena Rostova",
        roleTitle: "Principal Strategy Director",
        email: "elena.rostova@bookos.studio",
        timezone: "America/New_York",
        bio: "Leads executive advisory and GTM planning engagements for SaaS founders and enterprise studio clients.",
        avatarColor: "#2563eb",
        active: true,
      },
      {
        name: "Marcus Vance",
        roleTitle: "Lead Systems Architect",
        email: "marcus.vance@bookos.studio",
        timezone: "Europe/London",
        bio: "Specializes in distributed PostgreSQL systems, high-reliability booking pipelines, and zero-downtime launches.",
        avatarColor: "#0f766e",
        active: true,
      },
      {
        name: "Nadia Al-Mansoor",
        roleTitle: "Head of Product Design",
        email: "nadia.almansoor@bookos.studio",
        timezone: "Asia/Dubai",
        bio: "Designs serene, high-trust digital workspaces, editorial interfaces, and multi-platform design systems.",
        avatarColor: "#4f46e5",
        active: true,
      },
      {
        name: "Tariq Siddiqui",
        roleTitle: "Security & Cloud Advisor",
        email: "tariq.siddiqui@bookos.studio",
        timezone: "America/Chicago",
        bio: "Focuses on production hardening, identity security, compliance readiness, and resilient cloud architecture.",
        avatarColor: "#b45309",
        active: true,
      },
    ])
    .returning();

  const [staffElena, staffMarcus, staffNadia, staffTariq] = insertedStaff;

  // Weekly availability rules (Mon-Fri 09:00-17:00 for all; Sat morning for Elena & Nadia)
  const rulesToInsert: Array<{
    staffId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }> = [];

  for (const member of insertedStaff) {
    for (let dow = 1; dow <= 5; dow++) {
      rulesToInsert.push({
        staffId: member.id,
        dayOfWeek: dow,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  }
  rulesToInsert.push(
    { staffId: staffElena.id, dayOfWeek: 6, startTime: "10:00", endTime: "14:00" },
    { staffId: staffNadia.id, dayOfWeek: 0, startTime: "10:00", endTime: "15:00" },
  );

  await db.insert(availabilityRules).values(rulesToInsert);

  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        fullName: "Claire Beaumont",
        email: "claire@atelier-nord.io",
        phone: "+1 (212) 555-0148",
        timezone: "America/New_York",
        notes: "VP of Product at Atelier Nord. Prefers morning EST sessions.",
      },
      {
        fullName: "David Lindqvist",
        email: "david.lindqvist@kronohealth.co.uk",
        phone: "+44 20 7946 0812",
        timezone: "Europe/London",
        notes: "CTO scaling clinical scheduling across UK clinics.",
      },
      {
        fullName: "Amira Hassan",
        email: "amira@crescentventures.ae",
        phone: "+971 50 555 0192",
        timezone: "Asia/Dubai",
        notes: "Portfolio operations partner booking quarterly UX audits.",
      },
      {
        fullName: "Zainab Farooq",
        email: "zainab@meridianlabs.pk",
        phone: "+92 300 555 0174",
        timezone: "Asia/Karachi",
        notes: "Founder evaluating enterprise architecture modernization.",
      },
      {
        fullName: "Henrik Solberg",
        email: "henrik@nordicgrid.com",
        phone: "+1 (312) 555-0196",
        timezone: "America/Chicago",
        notes: "Engineering Director requesting pre-SOC2 technical readiness clinic.",
      },
      {
        fullName: "Sophia Morales",
        email: "sophia@vervecommerce.com",
        phone: "+1 (646) 555-0133",
        timezone: "America/New_York",
        notes: "Head of Growth scheduling quarterly strategy checkpoints.",
      },
    ])
    .returning();

  const [custClaire, custDavid, custAmira, custZainab, custHenrik, custSophia] = insertedCustomers;

  const todayNy = getDateKeyInTimezone(new Date(), "America/New_York");
  const todayLon = getDateKeyInTimezone(new Date(), "Europe/London");
  const todayDxb = getDateKeyInTimezone(new Date(), "Asia/Dubai");
  const todayChi = getDateKeyInTimezone(new Date(), "America/Chicago");

  const nextDay1Ny = nextWeekdayFrom(todayNy, 1);
  const nextDay2Ny = nextWeekdayFrom(todayNy, 2);
  const nextDay3Lon = nextWeekdayFrom(todayLon, 2);
  const nextDay1Dxb = nextWeekdayFrom(todayDxb, 1);
  const nextDay2Chi = nextWeekdayFrom(todayChi, 2);
  const pastDay1Ny = prevWeekdayFrom(todayNy, 2);
  const pastDay2Lon = prevWeekdayFrom(todayLon, 4);

  const makeSlot = (dateKey: string, timeStr: string, tz: string, durationMins: number) => {
    const startUtc = zonedWallTimeToUtc(dateKey, timeStr, tz);
    const endUtc = new Date(startUtc.getTime() + durationMins * 60_000);
    return { startUtc, endUtc };
  };

  const b1 = makeSlot(todayNy, "10:00", "America/New_York", svcStrategy.durationMins);
  const b2 = makeSlot(todayLon, "14:00", "Europe/London", svcArch.durationMins);
  const b3 = makeSlot(nextDay1Ny, "10:00", "America/New_York", svcStrategy.durationMins);
  const b4 = makeSlot(nextDay1Dxb, "11:00", "Asia/Dubai", svcUx.durationMins);
  const b5 = makeSlot(nextDay2Ny, "14:00", "America/New_York", svcDiscovery.durationMins);
  const b6 = makeSlot(nextDay3Lon, "10:00", "Europe/London", svcArch.durationMins);
  const b7 = makeSlot(nextDay2Chi, "13:00", "America/Chicago", svcSecurity.durationMins);
  const b8 = makeSlot(pastDay1Ny, "11:00", "America/New_York", svcStrategy.durationMins);
  const b9 = makeSlot(pastDay2Lon, "15:00", "Europe/London", svcArch.durationMins);
  const b10 = makeSlot(nextDay2Ny, "11:00", "America/New_York", svcUx.durationMins);

  const insertedBookings = await db
    .insert(bookings)
    .values([
      {
        bookingRef: "BK-1042A1",
        serviceId: svcStrategy.id,
        staffId: staffElena.id,
        customerId: custClaire.id,
        startUtc: b1.startUtc,
        endUtc: b1.endUtc,
        customerTimezone: custClaire.timezone,
        status: "confirmed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcStrategy.priceCents,
        paymentReceiptRef: "SBX-RCPT-8A41C209",
        notes: "Q4 enterprise roadmap review and hiring prioritization.",
      },
      {
        bookingRef: "BK-1042B2",
        serviceId: svcArch.id,
        staffId: staffMarcus.id,
        customerId: custDavid.id,
        startUtc: b2.startUtc,
        endUtc: b2.endUtc,
        customerTimezone: custDavid.timezone,
        status: "confirmed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcArch.priceCents,
        paymentReceiptRef: "SBX-RCPT-9B72D411",
        notes: "Multi-region PostgreSQL booking schema evaluation.",
      },
      {
        bookingRef: "BK-1042C3",
        serviceId: svcStrategy.id,
        staffId: staffElena.id,
        customerId: custSophia.id,
        startUtc: b3.startUtc,
        endUtc: b3.endUtc,
        customerTimezone: custSophia.timezone,
        status: "confirmed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcStrategy.priceCents,
        paymentReceiptRef: "SBX-RCPT-2F19E804",
        notes: "Expansion pricing tiers and enterprise onboarding.",
      },
      {
        bookingRef: "BK-1042D4",
        serviceId: svcUx.id,
        staffId: staffNadia.id,
        customerId: custAmira.id,
        startUtc: b4.startUtc,
        endUtc: b4.endUtc,
        customerTimezone: custAmira.timezone,
        status: "rescheduled",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcUx.priceCents,
        paymentReceiptRef: "SBX-RCPT-4D88A651",
        notes: "Rescheduled from previous afternoon slot; reviewing mobile booking flow.",
      },
      {
        bookingRef: "BK-1042E5",
        serviceId: svcDiscovery.id,
        staffId: staffElena.id,
        customerId: custZainab.id,
        startUtc: b5.startUtc,
        endUtc: b5.endUtc,
        customerTimezone: custZainab.timezone,
        status: "confirmed",
        paymentStatus: "unpaid",
        paymentAmountCents: svcDiscovery.priceCents,
        paymentReceiptRef: null,
        notes: "Initial scoping call for studio partnership.",
      },
      {
        bookingRef: "BK-1042F6",
        serviceId: svcArch.id,
        staffId: staffMarcus.id,
        customerId: custZainab.id,
        startUtc: b6.startUtc,
        endUtc: b6.endUtc,
        customerTimezone: custZainab.timezone,
        status: "confirmed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcArch.priceCents,
        paymentReceiptRef: "SBX-RCPT-7C30B912",
        notes: "API gateway latency & database connection pooling.",
      },
      {
        bookingRef: "BK-1042G7",
        serviceId: svcSecurity.id,
        staffId: staffTariq.id,
        customerId: custHenrik.id,
        startUtc: b7.startUtc,
        endUtc: b7.endUtc,
        customerTimezone: custHenrik.timezone,
        status: "confirmed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcSecurity.priceCents,
        paymentReceiptRef: "SBX-RCPT-6E51F220",
        notes: "Pre-launch security checklist & session hardening review.",
      },
      {
        bookingRef: "BK-1041H8",
        serviceId: svcStrategy.id,
        staffId: staffElena.id,
        customerId: custClaire.id,
        startUtc: b8.startUtc,
        endUtc: b8.endUtc,
        customerTimezone: custClaire.timezone,
        status: "completed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcStrategy.priceCents,
        paymentReceiptRef: "SBX-RCPT-1A09C318",
        notes: "Completed session — delivered Q3 executive memo.",
      },
      {
        bookingRef: "BK-1041J9",
        serviceId: svcArch.id,
        staffId: staffMarcus.id,
        customerId: custDavid.id,
        startUtc: b9.startUtc,
        endUtc: b9.endUtc,
        customerTimezone: custDavid.timezone,
        status: "completed",
        paymentStatus: "sandbox_paid",
        paymentAmountCents: svcArch.priceCents,
        paymentReceiptRef: "SBX-RCPT-3B44D790",
        notes: "Completed architecture blueprint review.",
      },
      {
        bookingRef: "BK-1042K0",
        serviceId: svcUx.id,
        staffId: staffElena.id,
        customerId: custSophia.id,
        startUtc: b10.startUtc,
        endUtc: b10.endUtc,
        customerTimezone: custSophia.timezone,
        status: "cancelled",
        paymentStatus: "refunded",
        paymentAmountCents: svcUx.priceCents,
        paymentReceiptRef: "SBX-RCPT-5E12A402",
        notes: "Cancelled by client due to board travel conflict; slot freed & sandbox payment refunded.",
      },
    ])
    .returning();

  // Seed automated reminders for active & completed bookings
  const reminderRows = [];
  for (const booking of insertedBookings) {
    if (booking.status === "cancelled") continue;
    const isCompleted = booking.status === "completed";
    const emailTime = new Date(booking.startUtc.getTime() - 24 * 60 * 60_000);
    const smsTime = new Date(booking.startUtc.getTime() - 60 * 60_000);
    reminderRows.push(
      {
        bookingId: booking.id,
        channel: "email",
        scheduledForUtc: emailTime,
        status: isCompleted ? "sent" : "scheduled",
        message: `24-hour email reminder for booking ${booking.bookingRef}.`,
      },
      {
        bookingId: booking.id,
        channel: "sms",
        scheduledForUtc: smsTime,
        status: isCompleted ? "sent" : "scheduled",
        message: `1-hour SMS reminder for booking ${booking.bookingRef}.`,
      },
    );
  }
  await db.insert(reminders).values(reminderRows);

  await db.insert(activityLogs).values([
    {
      actorName: "Elena Rostova",
      action: "booking.confirmed",
      entityType: "booking",
      entityId: "BK-1042A1",
      summary: "Confirmed Executive Strategy Consultation with Claire Beaumont (Sandbox Paid $180).",
    },
    {
      actorName: "Nadia Al-Mansoor",
      action: "booking.rescheduled",
      entityType: "booking",
      entityId: "BK-1042D4",
      summary: "Rescheduled Design System & UX Audit for Amira Hassan with overlap check passed.",
    },
    {
      actorName: "BookOS Automation",
      action: "reminder.scheduled",
      entityType: "reminder",
      entityId: "BK-1042G7",
      summary: "Scheduled 24h email and 1h SMS reminders for Henrik Solberg.",
    },
    {
      actorName: "Elena Rostova",
      action: "booking.cancelled",
      entityType: "booking",
      entityId: "BK-1042K0",
      summary: "Cancelled BK-1042K0 for Sophia Morales; slot released & sandbox payment refunded.",
    },
  ]);
}
