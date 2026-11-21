/**
 * Pure IANA timezone conversion & formatting utilities built on native Intl.DateTimeFormat.
 * Handles DST transitions cleanly without external date-library dependencies.
 */

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function extractZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = lookup("hour");
  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: hour === 24 ? 0 : hour,
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

/**
 * Computes the UTC offset in milliseconds for a given UTC instant in an IANA timezone.
 * Positive values mean the timezone is ahead of UTC (e.g. Asia/Dubai = +4h = +14400000ms).
 */
export function getTimezoneOffsetMs(utcDate: Date, timeZone: string): number {
  const p = extractZonedParts(utcDate, timeZone);
  const asUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtcMs - Math.floor(utcDate.getTime() / 1000) * 1000;
}

/**
 * Converts a local wall-clock date ("YYYY-MM-DD") and time ("HH:MM") in `timeZone`
 * to the exact UTC Date instant.
 */
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const naiveUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  // Two-pass convergence accurately handles DST transitions
  const guess1 = new Date(naiveUtcMs);
  const offset1 = getTimezoneOffsetMs(guess1, timeZone);
  const candidate1 = new Date(naiveUtcMs - offset1);
  const offset2 = getTimezoneOffsetMs(candidate1, timeZone);
  return new Date(naiveUtcMs - offset2);
}

/** Returns "YYYY-MM-DD" representing the local calendar date of `utcInput` in `timeZone`. */
export function getDateKeyInTimezone(utcInput: Date | string, timeZone: string): string {
  const date = typeof utcInput === "string" ? new Date(utcInput) : utcInput;
  const p = extractZonedParts(date, timeZone);
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

/** Returns day of week 0 (Sun) .. 6 (Sat) for a calendar date string "YYYY-MM-DD". */
export function getDayOfWeekForDateKey(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

/** Shifts a "YYYY-MM-DD" calendar key by `deltaDays`. */
export function addDaysToDateKey(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0));
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Returns the next weekday (Mon-Fri) date key from today in the given timezone. */
export function getNextWeekdayDateKey(timeZone: string, offsetDays = 1): string {
  const todayKey = getDateKeyInTimezone(new Date(), timeZone);
  let candidate = addDaysToDateKey(todayKey, offsetDays);
  for (let i = 0; i < 7; i++) {
    const dow = getDayOfWeekForDateKey(candidate);
    if (dow >= 1 && dow <= 5) return candidate;
    candidate = addDaysToDateKey(candidate, 1);
  }
  return candidate;
}

export function formatTimeInTimezone(utcInput: Date | string, timeZone: string): string {
  const date = typeof utcInput === "string" ? new Date(utcInput) : utcInput;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDateInTimezone(utcInput: Date | string, timeZone: string): string {
  const date = typeof utcInput === "string" ? new Date(utcInput) : utcInput;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeInTimezone(utcInput: Date | string, timeZone: string): string {
  const date = typeof utcInput === "string" ? new Date(utcInput) : utcInput;
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
