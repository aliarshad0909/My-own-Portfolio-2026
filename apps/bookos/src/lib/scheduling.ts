import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb, withDbTransaction } from "@/db";
import {
  activityLogs,
  availabilityRules,
  bookings,
  customers,
  reminders,
  services,
  staff,
} from "@/db/schema";
import { generateBookingRef, generateSandboxReceiptRef } from "@/lib/crypto";
import {
  addDaysToDateKey,
  formatDateTimeInTimezone,
  formatTimeInTimezone,
  getDateKeyInTimezone,
  getDayOfWeekForDateKey,
  minutesToTimeString,
  parseTimeToMinutes,
  zonedWallTimeToUtc,
} from "@/lib/timezone";

export const DOUBLE_BOOKING_MESSAGE =
  "Selected time slot is no longer available — double booking prevented";

export class SlotConflictError extends Error {
  readonly status = 409;
  constructor(message = DOUBLE_BOOKING_MESSAGE) {
    super(message);
    this.name = "SlotConflictError";
  }
}

export class BookingValidationError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingValidationError";
    this.status = status;
  }
}

export type ComputedSlot = {
  startUtc: string;
  endUtc: string;
  label: string;
  staffLabel: string;
  available: boolean;
};

export type ExistingInterval = {
  id?: string;
  startUtc: Date;
  endUtc: Date;
  status: string;
};

export type AvailabilityRuleInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

/**
 * Pure interval overlap check: returns true if two intervals intersect
 * (`existing.start < newEnd && existing.end > newStart`).
 */
export function hasBookingOverlap(
  existingBookings: ExistingInterval[],
  newStartUtc: Date,
  newEndUtc: Date,
  excludeBookingId?: string,
): boolean {
  return existingBookings.some((b) => {
    if (b.status === "cancelled") return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    return b.startUtc < newEndUtc && b.endUtc > newStartUtc;
  });
}

/**
 * Pure slot generator from weekly staff availability rules minus existing active bookings.
 */
export function generateSlotsForDate(params: {
  dateKey: string; // YYYY-MM-DD in viewerTimezone
  viewerTimezone: string;
  staffTimezone: string;
  durationMins: number;
  bufferMins: number;
  rules: AvailabilityRuleInput[];
  existingBookings: ExistingInterval[];
  excludeBookingId?: string;
}): ComputedSlot[] {
  const {
    dateKey,
    viewerTimezone,
    staffTimezone,
    durationMins,
    bufferMins,
    rules,
    existingBookings,
    excludeBookingId,
  } = params;

  const stepMins = Math.max(15, durationMins + bufferMins);
  const candidateDateKeys = [
    addDaysToDateKey(dateKey, -1),
    dateKey,
    addDaysToDateKey(dateKey, 1),
  ];

  const seenStartMs = new Set<number>();
  const slots: ComputedSlot[] = [];

  for (const staffDateKey of candidateDateKeys) {
    const dow = getDayOfWeekForDateKey(staffDateKey);
    const dayRules = rules.filter((r) => r.dayOfWeek === dow);

    for (const rule of dayRules) {
      const startMin = parseTimeToMinutes(rule.startTime);
      const endMin = parseTimeToMinutes(rule.endTime);

      for (let cursor = startMin; cursor + durationMins <= endMin; cursor += stepMins) {
        const timeStr = minutesToTimeString(cursor);
        const startUtc = zonedWallTimeToUtc(staffDateKey, timeStr, staffTimezone);
        const endUtc = new Date(startUtc.getTime() + durationMins * 60_000);

        // Keep only slots that fall on the requested calendar date in the viewer's timezone
        if (getDateKeyInTimezone(startUtc, viewerTimezone) !== dateKey) continue;
        if (seenStartMs.has(startUtc.getTime())) continue;
        seenStartMs.add(startUtc.getTime());

        const conflict = hasBookingOverlap(existingBookings, startUtc, endUtc, excludeBookingId);

        slots.push({
          startUtc: startUtc.toISOString(),
          endUtc: endUtc.toISOString(),
          label: formatTimeInTimezone(startUtc, viewerTimezone),
          staffLabel: formatTimeInTimezone(startUtc, staffTimezone),
          available: !conflict,
        });
      }
    }
  }

  slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return slots;
}

/**
 * Queries PostgreSQL availability_rules and active bookings for a staff/service/date
 * and computes live slots in the requested timezone.
 */
export async function computeAvailableSlots(params: {
  serviceId: string;
  staffId: string;
  dateKey: string;
  viewerTimezone: string;
  excludeBookingId?: string;
}): Promise<{
  service: typeof services.$inferSelect;
  staffMember: typeof staff.$inferSelect;
  slots: ComputedSlot[];
}> {
  const db = await getDb();

  const [[service], [staffMember]] = await Promise.all([
    db.select().from(services).where(eq(services.id, params.serviceId)).limit(1),
    db.select().from(staff).where(eq(staff.id, params.staffId)).limit(1),
  ]);

  if (!service) throw new BookingValidationError("Service not found.", 404);
  if (!staffMember) throw new BookingValidationError("Staff specialist not found.", 404);

  const windowStart = zonedWallTimeToUtc(
    addDaysToDateKey(params.dateKey, -2),
    "00:00",
    params.viewerTimezone,
  );
  const windowEnd = zonedWallTimeToUtc(
    addDaysToDateKey(params.dateKey, 2),
    "23:59",
    params.viewerTimezone,
  );

  const [rules, existing] = await Promise.all([
    db.select().from(availabilityRules).where(eq(availabilityRules.staffId, staffMember.id)),
    db
      .select({
        id: bookings.id,
        startUtc: bookings.startUtc,
        endUtc: bookings.endUtc,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.staffId, staffMember.id),
          ne(bookings.status, "cancelled"),
          lt(bookings.startUtc, windowEnd),
          gt(bookings.endUtc, windowStart),
        ),
      ),
  ]);

  const slots = generateSlotsForDate({
    dateKey: params.dateKey,
    viewerTimezone: params.viewerTimezone,
    staffTimezone: staffMember.timezone,
    durationMins: service.durationMins,
    bufferMins: service.bufferMins,
    rules,
    existingBookings: existing,
    excludeBookingId: params.excludeBookingId,
  });

  return { service, staffMember, slots };
}

function isPgUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: string; cause?: { code?: string } };
  return record.code === "23505" || record.cause?.code === "23505";
}

/**
 * Atomically creates a booking inside a PostgreSQL transaction with row-level staff locking,
 * strict overlap guard (`existing.start_utc < newEndUtc AND existing.end_utc > newStartUtc`),
 * sandbox payment simulation, automated reminders, and activity log entry.
 */
export async function createBookingAtomic(input: {
  serviceId: string;
  staffId: string;
  startUtc: Date;
  customerTimezone: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  simulateSandboxPayment: boolean;
  actorName?: string;
}) {
  try {
    return await withDbTransaction(async (tx) => {
      // Lock the staff row so concurrent booking attempts for this staff member serialize cleanly
      const [staffRow] = await tx
        .select()
        .from(staff)
        .where(eq(staff.id, input.staffId))
        .for("update")
        .limit(1);

      if (!staffRow || !staffRow.active) {
        throw new BookingValidationError("Selected staff specialist is unavailable.", 404);
      }

      const [serviceRow] = await tx
        .select()
        .from(services)
        .where(eq(services.id, input.serviceId))
        .limit(1);

      if (!serviceRow || !serviceRow.active) {
        throw new BookingValidationError("Selected service is unavailable.", 404);
      }

      const newStartUtc = input.startUtc;
      const newEndUtc = new Date(newStartUtc.getTime() + serviceRow.durationMins * 60_000);

      // Atomic overlap check against ALL non-cancelled bookings for this staff member
      const conflicting = await tx
        .select({ id: bookings.id, bookingRef: bookings.bookingRef })
        .from(bookings)
        .where(
          and(
            eq(bookings.staffId, staffRow.id),
            ne(bookings.status, "cancelled"),
            lt(bookings.startUtc, newEndUtc),
            gt(bookings.endUtc, newStartUtc),
          ),
        )
        .limit(1);

      if (conflicting.length > 0) {
        throw new SlotConflictError(DOUBLE_BOOKING_MESSAGE);
      }

      // Upsert or match customer by normalized email
      const normalizedEmail = input.customerEmail.trim().toLowerCase();
      let [customerRow] = await tx
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail))
        .limit(1);

      if (!customerRow) {
        [customerRow] = await tx
          .insert(customers)
          .values({
            fullName: input.customerName.trim(),
            email: normalizedEmail,
            phone: (input.customerPhone || "").trim(),
            timezone: input.customerTimezone,
            notes: "",
          })
          .returning();
      } else {
        [customerRow] = await tx
          .update(customers)
          .set({
            fullName: input.customerName.trim(),
            phone: (input.customerPhone || "").trim() || customerRow.phone,
            timezone: input.customerTimezone,
          })
          .where(eq(customers.id, customerRow.id))
          .returning();
      }

      const bookingRef = generateBookingRef();
      const paymentStatus = input.simulateSandboxPayment ? "sandbox_paid" : "unpaid";
      const paymentReceiptRef = input.simulateSandboxPayment ? generateSandboxReceiptRef() : null;

      const [createdBooking] = await tx
        .insert(bookings)
        .values({
          bookingRef,
          serviceId: serviceRow.id,
          staffId: staffRow.id,
          customerId: customerRow.id,
          startUtc: newStartUtc,
          endUtc: newEndUtc,
          customerTimezone: input.customerTimezone,
          status: "confirmed",
          paymentStatus,
          paymentAmountCents: serviceRow.priceCents,
          paymentReceiptRef,
          notes: (input.notes || "").trim(),
        })
        .returning();

      // Automatically schedule email (24h prior) and SMS (1h prior) reminders
      const nowMs = Date.now();
      const emailReminderUtc = new Date(
        Math.max(nowMs + 5 * 60_000, newStartUtc.getTime() - 24 * 60 * 60_000),
      );
      const smsReminderUtc = new Date(
        Math.max(nowMs + 5 * 60_000, newStartUtc.getTime() - 60 * 60_000),
      );

      const formattedTime = formatDateTimeInTimezone(newStartUtc, input.customerTimezone);

      const createdReminders = await tx
        .insert(reminders)
        .values([
          {
            bookingId: createdBooking.id,
            channel: "email",
            scheduledForUtc: emailReminderUtc,
            status: "scheduled",
            message: `Reminder: ${serviceRow.name} with ${staffRow.name} on ${formattedTime} (${input.customerTimezone}) — Ref ${bookingRef}.`,
          },
          {
            bookingId: createdBooking.id,
            channel: "sms",
            scheduledForUtc: smsReminderUtc,
            status: "scheduled",
            message: `Upcoming in 1h: ${serviceRow.name} with ${staffRow.name} (${bookingRef}).`,
          },
        ])
        .returning();

      await tx.insert(activityLogs).values({
        actorName: input.actorName || customerRow.fullName,
        action: "booking.created",
        entityType: "booking",
        entityId: bookingRef,
        summary: `Booked ${serviceRow.name} with ${staffRow.name} for ${customerRow.fullName} (${paymentStatus === "sandbox_paid" ? "Sandbox Paid" : "Unpaid"}).`,
      });

      return {
        booking: createdBooking,
        service: serviceRow,
        staff: staffRow,
        customer: customerRow,
        reminders: createdReminders,
      };
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      throw new SlotConflictError(DOUBLE_BOOKING_MESSAGE);
    }
    throw err;
  }
}

/**
 * Atomically reschedules an existing booking inside a PostgreSQL transaction,
 * enforcing the exact same overlap guard excluding the booking itself.
 */
export async function rescheduleBookingAtomic(input: {
  bookingId: string;
  newStartUtc: Date;
  newStaffId?: string;
  customerTimezone?: string;
  notes?: string;
  actorName: string;
}) {
  try {
    return await withDbTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!existing) {
        throw new BookingValidationError("Booking not found.", 404);
      }
      if (existing.status === "cancelled") {
        throw new BookingValidationError("Cancelled bookings cannot be rescheduled.", 400);
      }

      const targetStaffId = input.newStaffId || existing.staffId;

      // Lock target staff row to serialize concurrent mutations
      const [staffRow] = await tx
        .select()
        .from(staff)
        .where(eq(staff.id, targetStaffId))
        .for("update")
        .limit(1);

      if (!staffRow) {
        throw new BookingValidationError("Target staff specialist not found.", 404);
      }

      const [serviceRow] = await tx
        .select()
        .from(services)
        .where(eq(services.id, existing.serviceId))
        .limit(1);

      if (!serviceRow) {
        throw new BookingValidationError("Service not found.", 404);
      }

      const newStartUtc = input.newStartUtc;
      const newEndUtc = new Date(newStartUtc.getTime() + serviceRow.durationMins * 60_000);

      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.staffId, targetStaffId),
            ne(bookings.id, existing.id),
            ne(bookings.status, "cancelled"),
            lt(bookings.startUtc, newEndUtc),
            gt(bookings.endUtc, newStartUtc),
          ),
        )
        .limit(1);

      if (conflicting.length > 0) {
        throw new SlotConflictError(DOUBLE_BOOKING_MESSAGE);
      }

      const tz = input.customerTimezone || existing.customerTimezone;

      const [updated] = await tx
        .update(bookings)
        .set({
          staffId: targetStaffId,
          startUtc: newStartUtc,
          endUtc: newEndUtc,
          customerTimezone: tz,
          status: "rescheduled",
          notes: input.notes !== undefined ? input.notes : existing.notes,
          updatedAt: sql`NOW()`,
        })
        .where(eq(bookings.id, existing.id))
        .returning();

      // Refresh scheduled reminders for the new time
      await tx.delete(reminders).where(
        and(eq(reminders.bookingId, existing.id), eq(reminders.status, "scheduled")),
      );

      const nowMs = Date.now();
      const formattedTime = formatDateTimeInTimezone(newStartUtc, tz);
      await tx.insert(reminders).values([
        {
          bookingId: existing.id,
          channel: "email",
          scheduledForUtc: new Date(
            Math.max(nowMs + 5 * 60_000, newStartUtc.getTime() - 24 * 60 * 60_000),
          ),
          status: "scheduled",
          message: `Updated reminder: ${serviceRow.name} rescheduled to ${formattedTime} (${tz}) — Ref ${existing.bookingRef}.`,
        },
        {
          bookingId: existing.id,
          channel: "sms",
          scheduledForUtc: new Date(
            Math.max(nowMs + 5 * 60_000, newStartUtc.getTime() - 60 * 60_000),
          ),
          status: "scheduled",
          message: `Rescheduled appointment in 1h: ${serviceRow.name} with ${staffRow.name} (${existing.bookingRef}).`,
        },
      ]);

      await tx.insert(activityLogs).values({
        actorName: input.actorName,
        action: "booking.rescheduled",
        entityType: "booking",
        entityId: existing.bookingRef,
        summary: `Rescheduled ${existing.bookingRef} (${serviceRow.name}) to ${formattedTime} (${tz}).`,
      });

      return updated;
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      throw new SlotConflictError(DOUBLE_BOOKING_MESSAGE);
    }
    throw err;
  }
}

/**
 * Atomically cancels a booking, immediately releasing its time slot (so another booking
 * can take that exact instant) and setting sandbox_paid payments to refunded.
 */
export async function cancelBookingAtomic(input: {
  bookingId: string;
  reason?: string;
  actorName: string;
}) {
  return withDbTransaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update")
      .limit(1);

    if (!existing) {
      throw new BookingValidationError("Booking not found.", 404);
    }
    if (existing.status === "cancelled") {
      return existing;
    }

    const nextPaymentStatus =
      existing.paymentStatus === "sandbox_paid" ? "refunded" : existing.paymentStatus;

    const noteSuffix = input.reason?.trim()
      ? `${existing.notes ? `${existing.notes} | ` : ""}Cancelled: ${input.reason.trim()}`
      : existing.notes;

    const [updated] = await tx
      .update(bookings)
      .set({
        status: "cancelled",
        paymentStatus: nextPaymentStatus,
        notes: noteSuffix,
        updatedAt: sql`NOW()`,
      })
      .where(eq(bookings.id, existing.id))
      .returning();

    // Remove pending reminders for the cancelled booking
    await tx
      .delete(reminders)
      .where(and(eq(reminders.bookingId, existing.id), eq(reminders.status, "scheduled")));

    await tx.insert(activityLogs).values({
      actorName: input.actorName,
      action: "booking.cancelled",
      entityType: "booking",
      entityId: existing.bookingRef,
      summary: `Cancelled booking ${existing.bookingRef}; slot released${nextPaymentStatus === "refunded" ? " & sandbox payment refunded" : ""}.`,
    });

    return updated;
  });
}

export async function completeBookingAtomic(input: { bookingId: string; actorName: string }) {
  return withDbTransaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .limit(1);

    if (!existing) {
      throw new BookingValidationError("Booking not found.", 404);
    }
    if (existing.status === "cancelled") {
      throw new BookingValidationError("Cancelled bookings cannot be marked completed.", 400);
    }

    const [updated] = await tx
      .update(bookings)
      .set({
        status: "completed",
        updatedAt: sql`NOW()`,
      })
      .where(eq(bookings.id, existing.id))
      .returning();

    await tx.insert(activityLogs).values({
      actorName: input.actorName,
      action: "booking.completed",
      entityType: "booking",
      entityId: existing.bookingRef,
      summary: `Marked booking ${existing.bookingRef} as completed.`,
    });

    return updated;
  });
}
