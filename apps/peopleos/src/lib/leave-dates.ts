export const MAX_LEAVE_WINDOW_DAYS = 30;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseStrictIsoDateUtcMs(dateStr: string): number | null {
  if (!ISO_DATE_RE.test(dateStr)) return null;
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const ms = Date.UTC(year, month - 1, day);
  const parsed = new Date(ms);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

/**
 * Computes the true inclusive calendar-day span between startDate and endDate (YYYY-MM-DD).
 * Returns null if either date is not a valid calendar date; returns <= 0 when endDate < startDate.
 * Never truncates or clamps oversized date ranges.
 */
export function calculateInclusiveLeaveDays(startDate: string, endDate: string): number | null {
  const startMs = parseStrictIsoDateUtcMs(startDate);
  const endMs = parseStrictIsoDateUtcMs(endDate);
  if (startMs === null || endMs === null) return null;
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export type LeaveDateValidationResult =
  | { ok: true; days: number }
  | { ok: false; error: string; days: number | null };

/**
 * Validates that a leave window has valid calendar dates, endDate >= startDate,
 * spans at most maxDays (default 30) calendar days, and—if daysRequested is provided—
 * matches the exact inclusive calendar-day span.
 */
export function validateLeaveDateWindow(
  startDate: string,
  endDate: string,
  daysRequested?: number,
  maxDays: number = MAX_LEAVE_WINDOW_DAYS,
): LeaveDateValidationResult {
  const days = calculateInclusiveLeaveDays(startDate, endDate);
  if (days === null) {
    return {
      ok: false,
      error: "Start date and end date must be valid YYYY-MM-DD calendar dates.",
      days: null,
    };
  }

  if (days < 1) {
    return {
      ok: false,
      error: "End date must be on or after the start date.",
      days,
    };
  }

  if (days > maxDays) {
    return {
      ok: false,
      error: `Leave request cannot exceed ${maxDays} calendar days (selected window is ${days} days).`,
      days,
    };
  }

  if (daysRequested !== undefined && daysRequested !== days) {
    return {
      ok: false,
      error: `Requested days (${daysRequested}) must match the inclusive date range (${days} calendar day(s)).`,
      days,
    };
  }

  return { ok: true, days };
}
