import assert from "node:assert/strict";
import test from "node:test";
import { eq } from "drizzle-orm";

// Run integration tests against isolated in-memory real PostgreSQL (PGlite)
process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";
process.env.BOOKOS_DATABASE_URL = "";

import { getDb, resetDemoWorkspace } from "../src/db";
import { bookings, reminders, services, staff } from "../src/db/schema";
import {
  BookingValidationError,
  DOUBLE_BOOKING_MESSAGE,
  SlotConflictError,
  cancelBookingAtomic,
  completeBookingAtomic,
  computeAvailableSlots,
  createBookingAtomic,
  rescheduleBookingAtomic,
} from "../src/lib/scheduling";
import { zonedWallTimeToUtc } from "../src/lib/timezone";

test("PostgreSQL end-to-end scheduling lifecycle: slots, double-booking guard, reschedule, cancel+rebook, and reset", async () => {
  const db = await getDb();

  const [service] = await db.select().from(services).limit(1);
  const [specialist] = await db.select().from(staff).limit(1);
  assert.ok(service, "Seeded service must exist");
  assert.ok(specialist, "Seeded staff specialist must exist");

  // Pick a guaranteed open future Monday far from seeded bookings
  const targetDate = "2027-03-15"; // Monday

  // 1. Live slot availability computation from availability_rules minus bookings
  const initialSlots = await computeAvailableSlots({
    serviceId: service.id,
    staffId: specialist.id,
    dateKey: targetDate,
    viewerTimezone: specialist.timezone,
  });
  assert.ok(initialSlots.slots.length >= 4, "Expected multiple open slots on Monday");
  assert.ok(
    initialSlots.slots.every((s) => s.available),
    "All slots on future open Monday should start available",
  );

  const slot1 = initialSlots.slots[0];
  const slot2 = initialSlots.slots[1];
  const slot3 = initialSlots.slots[2];

  // 2. Booking creation + simulated sandbox payment + automated reminders
  const created = await createBookingAtomic({
    serviceId: service.id,
    staffId: specialist.id,
    startUtc: new Date(slot1.startUtc),
    customerTimezone: "America/New_York",
    customerName: "Test Client Alpha",
    customerEmail: "alpha@example.com",
    customerPhone: "+1 555-0100",
    notes: "First integration booking",
    simulateSandboxPayment: true,
    actorName: "Test Runner",
  });

  assert.equal(created.booking.status, "confirmed");
  assert.equal(created.booking.paymentStatus, "sandbox_paid");
  assert.ok(created.booking.paymentReceiptRef?.startsWith("SBX-RCPT-"));
  assert.equal(created.reminders.length, 2, "Should automatically schedule email & sms reminders");

  const storedReminders = await db
    .select()
    .from(reminders)
    .where(eq(reminders.bookingId, created.booking.id));
  assert.equal(storedReminders.length, 2);

  // Verify slot1 is now marked unavailable in live slot query
  const afterBookSlots = await computeAvailableSlots({
    serviceId: service.id,
    staffId: specialist.id,
    dateKey: targetDate,
    viewerTimezone: specialist.timezone,
  });
  assert.equal(
    afterBookSlots.slots.find((s) => s.startUtc === slot1.startUtc)?.available,
    false,
    "Booked slot must immediately show as unavailable",
  );

  // 3. STRICT DOUBLE-BOOKING REJECTION (exact slot)
  await assert.rejects(
    async () => {
      await createBookingAtomic({
        serviceId: service.id,
        staffId: specialist.id,
        startUtc: new Date(slot1.startUtc),
        customerTimezone: "America/New_York",
        customerName: "Test Client Beta",
        customerEmail: "beta@example.com",
        simulateSandboxPayment: false,
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof SlotConflictError);
      assert.equal(err.status, 409);
      assert.equal(err.message, DOUBLE_BOOKING_MESSAGE);
      return true;
    },
  );

  // 3b. STRICT DOUBLE-BOOKING REJECTION (partially overlapping 15 mins later)
  const partialOverlapStart = new Date(new Date(slot1.startUtc).getTime() + 15 * 60_000);
  await assert.rejects(
    async () => {
      await createBookingAtomic({
        serviceId: service.id,
        staffId: specialist.id,
        startUtc: partialOverlapStart,
        customerTimezone: "America/New_York",
        customerName: "Test Client Gamma",
        customerEmail: "gamma@example.com",
        simulateSandboxPayment: false,
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  // Create a second booking at slot3 so we can test reschedule conflict guard too
  await createBookingAtomic({
    serviceId: service.id,
    staffId: specialist.id,
    startUtc: new Date(slot3.startUtc),
    customerTimezone: "Europe/London",
    customerName: "Test Client Delta",
    customerEmail: "delta@example.com",
    simulateSandboxPayment: false,
  });

  // Attempting to reschedule booking 1 onto occupied slot3 must be rejected with 409
  await assert.rejects(
    async () => {
      await rescheduleBookingAtomic({
        bookingId: created.booking.id,
        newStartUtc: new Date(slot3.startUtc),
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  // 4. Rescheduling to an open slot (slot2) succeeds and frees slot1
  const rescheduled = await rescheduleBookingAtomic({
    bookingId: created.booking.id,
    newStartUtc: new Date(slot2.startUtc),
    customerTimezone: "Europe/London",
    actorName: "Test Runner",
  });
  assert.equal(rescheduled.status, "rescheduled");
  assert.equal(rescheduled.startUtc.toISOString(), slot2.startUtc);

  const afterRescheduleSlots = await computeAvailableSlots({
    serviceId: service.id,
    staffId: specialist.id,
    dateKey: targetDate,
    viewerTimezone: specialist.timezone,
  });
  assert.equal(
    afterRescheduleSlots.slots.find((s) => s.startUtc === slot1.startUtc)?.available,
    true,
    "Old slot must be free after rescheduling",
  );
  assert.equal(
    afterRescheduleSlots.slots.find((s) => s.startUtc === slot2.startUtc)?.available,
    false,
    "New slot must be occupied after rescheduling",
  );

  // 5. Cancellation frees slot2 immediately & updates sandbox_paid -> refunded
  const cancelled = await cancelBookingAtomic({
    bookingId: created.booking.id,
    reason: "Client rescheduled externally",
    actorName: "Test Runner",
  });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.paymentStatus, "refunded");

  // Re-booking the EXACT freed slot2 must succeed cleanly (verifying partial unique index WHERE status <> 'cancelled')
  const rebooked = await createBookingAtomic({
    serviceId: service.id,
    staffId: specialist.id,
    startUtc: new Date(slot2.startUtc),
    customerTimezone: "Asia/Dubai",
    customerName: "Rebooked Customer",
    customerEmail: "rebooked@example.com",
    simulateSandboxPayment: true,
  });
  assert.equal(rebooked.booking.status, "confirmed");
  assert.equal(rebooked.booking.startUtc.toISOString(), slot2.startUtc);

  // 6. Demo reset cleanly restores seeded dataset
  await resetDemoWorkspace();
  const afterReset = await db.select().from(bookings);
  assert.equal(afterReset.length, 10, "Demo reset should restore exactly 10 seeded bookings");
});

test("PostgreSQL concurrency guard: cancel vs reschedule & cancel vs complete never resurrect a cancelled booking", async () => {
  await resetDemoWorkspace();
  const db = await getDb();

  const [service] = await db.select().from(services).limit(1);
  const [specialist] = await db.select().from(staff).limit(1);
  assert.ok(service && specialist);

  // Pick a clean future Monday
  const targetDate = "2027-04-12";
  const openSlots = await computeAvailableSlots({
    serviceId: service.id,
    staffId: specialist.id,
    dateKey: targetDate,
    viewerTimezone: specialist.timezone,
  });
  assert.ok(openSlots.slots.length >= 4);

  // Case A: Concurrent cancelBookingAtomic + rescheduleBookingAtomic on the same active booking
  const bookingA = await createBookingAtomic({
    serviceId: service.id,
    staffId: specialist.id,
    startUtc: new Date(openSlots.slots[0].startUtc),
    customerTimezone: specialist.timezone,
    customerName: "Race Client A",
    customerEmail: "race-a@example.com",
    simulateSandboxPayment: true,
    actorName: "Test Runner",
  });

  const [cancelResA, rescheduleResA] = await Promise.allSettled([
    cancelBookingAtomic({
      bookingId: bookingA.booking.id,
      reason: "Concurrent cancellation",
      actorName: "Admin A",
    }),
    rescheduleBookingAtomic({
      bookingId: bookingA.booking.id,
      newStartUtc: new Date(openSlots.slots[1].startUtc),
      actorName: "Admin B",
    }),
  ]);

  // Cancel MUST succeed (either first, blocking reschedule with 409, or right after reschedule, cancelling it)
  assert.equal(cancelResA.status, "fulfilled");
  const [finalRowA] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingA.booking.id))
    .limit(1);
  assert.equal(
    finalRowA.status,
    "cancelled",
    "Cancelled booking must NEVER be resurrected by a concurrent reschedule",
  );

  // If reschedule lost the race to cancel, it must reject cleanly with 409
  if (rescheduleResA.status === "rejected") {
    assert.ok(rescheduleResA.reason instanceof BookingValidationError);
    assert.equal(rescheduleResA.reason.status, 409);
  }

  // Zero orphaned scheduled reminders may remain on a cancelled booking
  const remainingRemindersA = await db
    .select()
    .from(reminders)
    .where(eq(reminders.bookingId, bookingA.booking.id));
  assert.equal(
    remainingRemindersA.filter((r) => r.status === "scheduled").length,
    0,
    "Cancelled booking must have zero orphaned scheduled reminders",
  );

  // Subsequent attempts to reschedule, complete, or re-cancel the cancelled booking MUST reject with 409
  await assert.rejects(
    async () => {
      await rescheduleBookingAtomic({
        bookingId: bookingA.booking.id,
        newStartUtc: new Date(openSlots.slots[2].startUtc),
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof BookingValidationError && err.status === 409,
  );
  await assert.rejects(
    async () => {
      await completeBookingAtomic({
        bookingId: bookingA.booking.id,
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof BookingValidationError && err.status === 409,
  );
  await assert.rejects(
    async () => {
      await cancelBookingAtomic({
        bookingId: bookingA.booking.id,
        reason: "Double cancel",
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof BookingValidationError && err.status === 409,
  );

  // Case B: Concurrent cancelBookingAtomic + completeBookingAtomic on the same active booking
  const bookingB = await createBookingAtomic({
    serviceId: service.id,
    staffId: specialist.id,
    startUtc: new Date(openSlots.slots[2].startUtc),
    customerTimezone: specialist.timezone,
    customerName: "Race Client B",
    customerEmail: "race-b@example.com",
    simulateSandboxPayment: false,
    actorName: "Test Runner",
  });

  const resultsB = await Promise.allSettled([
    cancelBookingAtomic({
      bookingId: bookingB.booking.id,
      reason: "Concurrent cancel vs complete",
      actorName: "Admin A",
    }),
    completeBookingAtomic({
      bookingId: bookingB.booking.id,
      actorName: "Admin B",
    }),
  ]);

  const fulfilledB = resultsB.filter((r) => r.status === "fulfilled");
  const rejectedB = resultsB.filter((r) => r.status === "rejected");
  assert.equal(fulfilledB.length, 1, "Exactly one terminal mutation must win");
  assert.equal(rejectedB.length, 1, "Competing terminal mutation must reject cleanly");
  assert.ok(rejectedB[0].reason instanceof BookingValidationError);
  assert.equal(rejectedB[0].reason.status, 409);

  const [finalRowB] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingB.booking.id))
    .limit(1);
  assert.ok(
    finalRowB.status === "cancelled" || finalRowB.status === "completed",
    "Booking must end in a consistent terminal state",
  );
  if (finalRowB.status === "cancelled") {
    const remindersB = await db
      .select()
      .from(reminders)
      .where(eq(reminders.bookingId, bookingB.booking.id));
    assert.equal(remindersB.filter((r) => r.status === "scheduled").length, 0);
  }
});

test("PostgreSQL buffer enforcement: existing appointment buffer and candidate buffer block overlapping slots on availability, create, and reschedule", async () => {
  await resetDemoWorkspace();
  const db = await getDb();

  const [specialist] = await db.select().from(staff).limit(1);
  assert.ok(specialist);

  // Create explicit services:
  // 1) 45-min service with 15-min buffer (09:00-09:45 -> effective blocked window 09:00-10:00)
  // 2) 15-min service with 0-min buffer
  // 3) 15-min service with 15-min buffer (for testing candidate's own buffer colliding with later booking)
  const [svc45With15Buf, svc15ZeroBuf, svc15With15Buf] = await db
    .insert(services)
    .values([
      {
        name: "Buffer Test 45+15",
        slug: "buffer-test-45-15",
        category: "Testing",
        durationMins: 45,
        bufferMins: 15,
        priceCents: 15000,
        currency: "USD",
        description: "45m appointment with 15m buffer",
        active: true,
      },
      {
        name: "Quick Check-in 15+0",
        slug: "quick-checkin-15-0",
        category: "Testing",
        durationMins: 15,
        bufferMins: 0,
        priceCents: 5000,
        currency: "USD",
        description: "15m appointment with zero buffer",
        active: true,
      },
      {
        name: "Quick Buffered 15+15",
        slug: "quick-buffered-15-15",
        category: "Testing",
        durationMins: 15,
        bufferMins: 15,
        priceCents: 7500,
        currency: "USD",
        description: "15m appointment with 15m buffer",
        active: true,
      },
    ])
    .returning();

  // Future Monday 2027-05-10 in specialist timezone (Mon-Fri 09:00-17:00)
  const dateKey = "2027-05-10";
  const tz = specialist.timezone;
  const t0900 = zonedWallTimeToUtc(dateKey, "09:00", tz);
  const t0945 = zonedWallTimeToUtc(dateKey, "09:45", tz);
  const t1000 = zonedWallTimeToUtc(dateKey, "10:00", tz);
  const t1100 = zonedWallTimeToUtc(dateKey, "11:00", tz);
  const t1120 = zonedWallTimeToUtc(dateKey, "11:20", tz);
  const t1030 = zonedWallTimeToUtc(dateKey, "10:30", tz);

  // 1. Create existing 09:00-09:45 booking with 15-min buffer (effective block: 09:00-10:00)
  await createBookingAtomic({
    serviceId: svc45With15Buf.id,
    staffId: specialist.id,
    startUtc: t0900,
    customerTimezone: tz,
    customerName: "Buffer Holder",
    customerEmail: "holder@example.com",
    simulateSandboxPayment: false,
    actorName: "Test Runner",
  });

  // 2. Query computeAvailableSlots for 15-min 0-buffer service:
  //    09:45 MUST be excluded from available slots; 10:00 MUST be available
  const zeroBufAvailability = await computeAvailableSlots({
    serviceId: svc15ZeroBuf.id,
    staffId: specialist.id,
    dateKey,
    viewerTimezone: tz,
  });
  assert.equal(
    zeroBufAvailability.slots.find((s) => s.startUtc === t0945.toISOString())?.available,
    false,
    "09:45 falls inside existing 09:00-09:45 (+15m buffer) window and must not be advertised as available",
  );
  assert.equal(
    zeroBufAvailability.slots.find((s) => s.startUtc === t1000.toISOString())?.available,
    true,
    "10:00 starts cleanly after existing 15m buffer ends and must be available",
  );

  // 3. Attempting createBookingAtomic at 09:45 (0-buffer) MUST reject with 409
  await assert.rejects(
    async () => {
      await createBookingAtomic({
        serviceId: svc15ZeroBuf.id,
        staffId: specialist.id,
        startUtc: t0945,
        customerTimezone: tz,
        customerName: "Buffer Violator",
        customerEmail: "violator@example.com",
        simulateSandboxPayment: false,
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  // 4. Creating the 15-min 0-buffer booking at 10:00 MUST succeed
  const okAt1000 = await createBookingAtomic({
    serviceId: svc15ZeroBuf.id,
    staffId: specialist.id,
    startUtc: t1000,
    customerTimezone: tz,
    customerName: "Clean Adjacent Client",
    customerEmail: "adjacent@example.com",
    simulateSandboxPayment: false,
    actorName: "Test Runner",
  });
  assert.equal(okAt1000.booking.status, "confirmed");
  assert.equal(okAt1000.booking.startUtc.toISOString(), t1000.toISOString());

  // 5. Rescheduling the 10:00 booking back into 09:45 (inside existing 15m buffer) MUST reject with 409
  await assert.rejects(
    async () => {
      await rescheduleBookingAtomic({
        bookingId: okAt1000.booking.id,
        newStartUtc: t0945,
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  // 6. Verify a NEW candidate booking's OWN buffer cannot collide with a subsequent existing booking:
  //    Place an existing 0-buffer booking at 11:20-11:35
  await createBookingAtomic({
    serviceId: svc15ZeroBuf.id,
    staffId: specialist.id,
    startUtc: t1120,
    customerTimezone: tz,
    customerName: "Subsequent Booking",
    customerEmail: "subsequent@example.com",
    simulateSandboxPayment: false,
    actorName: "Test Runner",
  });

  //    Candidate 11:00-11:15 with 15-min buffer has effective window 11:00-11:30 -> collides with 11:20!
  const bufferedAvailability = await computeAvailableSlots({
    serviceId: svc15With15Buf.id,
    staffId: specialist.id,
    dateKey,
    viewerTimezone: tz,
  });
  assert.equal(
    bufferedAvailability.slots.find((s) => s.startUtc === t1100.toISOString())?.available,
    false,
    "11:00 (+15m duration +15m buffer = 11:30) must be excluded when a booking starts at 11:20",
  );
  assert.equal(
    bufferedAvailability.slots.find((s) => s.startUtc === t1030.toISOString())?.available,
    true,
    "10:30 (+15m duration +15m buffer = 11:00) must remain available before 11:20",
  );

  await assert.rejects(
    async () => {
      await createBookingAtomic({
        serviceId: svc15With15Buf.id,
        staffId: specialist.id,
        startUtc: t1100,
        customerTimezone: tz,
        customerName: "Own Buffer Violator",
        customerEmail: "own-buffer@example.com",
        simulateSandboxPayment: false,
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  //    Creating at 10:30 (effective end 11:00 <= 11:20) succeeds, and rescheduling it to 11:00 rejects with 409
  const okAt1030 = await createBookingAtomic({
    serviceId: svc15With15Buf.id,
    staffId: specialist.id,
    startUtc: t1030,
    customerTimezone: tz,
    customerName: "Clean Buffered Client",
    customerEmail: "clean-buffered@example.com",
    simulateSandboxPayment: false,
    actorName: "Test Runner",
  });
  assert.equal(okAt1030.booking.status, "confirmed");

  await assert.rejects(
    async () => {
      await rescheduleBookingAtomic({
        bookingId: okAt1030.booking.id,
        newStartUtc: t1100,
        actorName: "Test Runner",
      });
    },
    (err: unknown) => err instanceof SlotConflictError && err.status === 409,
  );

  // Restore clean demo dataset
  await resetDemoWorkspace();
});
