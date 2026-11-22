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

test("buffer-aware overlap blocks existing appointment buffers and candidate booking buffers symmetrically", () => {
  // Existing 09:00-09:45 booking with 15m buffer -> effective blocked window 09:00-10:00
  const existingStart = zonedWallTimeToUtc("2026-06-15", "09:00", "America/New_York");
  const existingEnd = new Date(existingStart.getTime() + 45 * 60_000);
  const existing = [
    {
      id: "bk-buffered",
      startUtc: existingStart,
      endUtc: existingEnd,
      bufferMins: 15,
      status: "confirmed",
    },
  ];

  // Candidate 09:45-10:00 (0-buffer) falls inside existing 15m buffer -> MUST conflict
  const slot0945Start = zonedWallTimeToUtc("2026-06-15", "09:45", "America/New_York");
  const slot0945End = new Date(slot0945Start.getTime() + 15 * 60_000);
  assert.equal(hasBookingOverlap(existing, slot0945Start, slot0945End, undefined, 0), true);

  // Candidate 10:00-10:15 (0-buffer) starts right when buffer ends -> MUST be allowed
  const slot1000Start = zonedWallTimeToUtc("2026-06-15", "10:00", "America/New_York");
  const slot1000End = new Date(slot1000Start.getTime() + 15 * 60_000);
  assert.equal(hasBookingOverlap(existing, slot1000Start, slot1000End, undefined, 0), false);

  // generateSlotsForDate for a 15-min 0-buffer service excludes 09:45 from available slots and allows 10:00
  const slots = generateSlotsForDate({
    dateKey: "2026-06-15",
    viewerTimezone: "America/New_York",
    staffTimezone: "America/New_York",
    durationMins: 15,
    bufferMins: 0,
    rules: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:30" }],
    existingBookings: existing,
  });
  assert.equal(slots.find((s) => s.startUtc === slot0945Start.toISOString())?.available, false);
  assert.equal(slots.find((s) => s.startUtc === slot1000Start.toISOString())?.available, true);

  // New booking's OWN buffer (09:00-09:15 + 15m buffer => effective end 09:30) collides with 09:20 existing booking
  const laterStart = zonedWallTimeToUtc("2026-06-15", "09:20", "America/New_York");
  const laterEnd = new Date(laterStart.getTime() + 30 * 60_000);
  const candidate0900Start = zonedWallTimeToUtc("2026-06-15", "09:00", "America/New_York");
  const candidate0900End = new Date(candidate0900Start.getTime() + 15 * 60_000);
  assert.equal(
    hasBookingOverlap(
      [{ id: "bk-later", startUtc: laterStart, endUtc: laterEnd, bufferMins: 0, status: "confirmed" }],
      candidate0900Start,
      candidate0900End,
      undefined,
      15,
    ),
    true,
  );
  // Same 09:00-09:15 + 15m buffer against an existing booking at 09:30 -> allowed
  const nonCollidingStart = zonedWallTimeToUtc("2026-06-15", "09:30", "America/New_York");
  const nonCollidingEnd = new Date(nonCollidingStart.getTime() + 30 * 60_000);
  assert.equal(
    hasBookingOverlap(
      [
        {
          id: "bk-0930",
          startUtc: nonCollidingStart,
          endUtc: nonCollidingEnd,
          bufferMins: 0,
          status: "confirmed",
        },
      ],
      candidate0900Start,
      candidate0900End,
      undefined,
      15,
    ),
    false,
  );
});

test("scrypt password hashing, locked password generation, and session secret checks", () => {
  const hash = hashPassword("BookDemo2026!");
  assert.equal(verifyPassword("BookDemo2026!", hash), true);
  assert.equal(verifyPassword("WrongPass", hash), false);
  assert.ok(generateLockedPassword().length >= 64);
  assert.ok(resolveSessionSecret().length >= 16);
});
