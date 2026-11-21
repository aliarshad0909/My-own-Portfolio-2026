import assert from "node:assert/strict";
import test from "node:test";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "../src/lib/crypto";
import { generateSlotsForDate, hasBookingOverlap } from "../src/lib/scheduling";
import {
  formatTimeInTimezone,
  getDateKeyInTimezone,
  zonedWallTimeToUtc,
} from "../src/lib/timezone";

test("timezone conversions round-trip accurately across global IANA zones", () => {
  const nyMorning = zonedWallTimeToUtc("2026-06-15", "09:00", "America/New_York");
  assert.equal(nyMorning.toISOString(), "2026-06-15T13:00:00.000Z"); // EDT is UTC-4
  assert.equal(getDateKeyInTimezone(nyMorning, "America/New_York"), "2026-06-15");
  assert.equal(formatTimeInTimezone(nyMorning, "Europe/London"), "2:00 PM"); // BST is UTC+1
  assert.equal(formatTimeInTimezone(nyMorning, "Asia/Dubai"), "5:00 PM"); // GST is UTC+4
  assert.equal(formatTimeInTimezone(nyMorning, "Asia/Karachi"), "6:00 PM"); // PKT is UTC+5
});

test("hasBookingOverlap detects exact, partial, and enclosing overlaps while ignoring adjacent & cancelled", () => {
  const existing = [
    {
      id: "bk-1",
      startUtc: new Date("2026-06-15T14:00:00.000Z"),
      endUtc: new Date("2026-06-15T14:45:00.000Z"),
      status: "confirmed",
    },
    {
      id: "bk-cancelled",
      startUtc: new Date("2026-06-15T16:00:00.000Z"),
      endUtc: new Date("2026-06-15T16:45:00.000Z"),
      status: "cancelled",
    },
  ];

  // Exact overlap
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T14:00:00.000Z"),
      new Date("2026-06-15T14:45:00.000Z"),
    ),
    true,
  );
  // Partial overlap (starts inside existing)
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T14:30:00.000Z"),
      new Date("2026-06-15T15:15:00.000Z"),
    ),
    true,
  );
  // Partial overlap (ends inside existing)
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T13:30:00.000Z"),
      new Date("2026-06-15T14:15:00.000Z"),
    ),
    true,
  );
  // Adjacent boundary touch — allowed
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T14:45:00.000Z"),
      new Date("2026-06-15T15:30:00.000Z"),
    ),
    false,
  );
  // Cancelled booking does not block
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T16:00:00.000Z"),
      new Date("2026-06-15T16:45:00.000Z"),
    ),
    false,
  );
  // Excluding self when rescheduling
  assert.equal(
    hasBookingOverlap(
      existing,
      new Date("2026-06-15T14:00:00.000Z"),
      new Date("2026-06-15T14:45:00.000Z"),
      "bk-1",
    ),
    false,
  );
});

test("generateSlotsForDate computes open vs booked slots with buffers", () => {
  // Monday 2026-06-15 (dayOfWeek = 1)
  const bookedStart = zonedWallTimeToUtc("2026-06-15", "10:00", "America/New_York");
  const bookedEnd = new Date(bookedStart.getTime() + 45 * 60_000);

  const slots = generateSlotsForDate({
    dateKey: "2026-06-15",
    viewerTimezone: "America/New_York",
    staffTimezone: "America/New_York",
    durationMins: 45,
    bufferMins: 15,
    rules: [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }],
    existingBookings: [{ startUtc: bookedStart, endUtc: bookedEnd, status: "confirmed" }],
  });

  // 09:00, 10:00, 11:00 (step = 45 + 15 = 60 mins)
  assert.equal(slots.length, 3);
  assert.equal(slots[0].label, "9:00 AM");
  assert.equal(slots[0].available, true);
  assert.equal(slots[1].label, "10:00 AM");
  assert.equal(slots[1].available, false);
  assert.equal(slots[2].label, "11:00 AM");
  assert.equal(slots[2].available, true);
});

test("scrypt password hashing, locked password generation, and session secret checks", () => {
  const hash = hashPassword("BookDemo2026!");
  assert.equal(verifyPassword("BookDemo2026!", hash), true);
  assert.equal(verifyPassword("WrongPass", hash), false);
  assert.ok(generateLockedPassword().length >= 64);
  assert.ok(resolveSessionSecret().length >= 16);
});
