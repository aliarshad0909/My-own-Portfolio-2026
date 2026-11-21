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
  DOUBLE_BOOKING_MESSAGE,
  SlotConflictError,
  cancelBookingAtomic,
  computeAvailableSlots,
  createBookingAtomic,
  rescheduleBookingAtomic,
} from "../src/lib/scheduling";

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
