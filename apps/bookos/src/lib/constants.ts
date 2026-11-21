export const SUPPORTED_TIMEZONES = [
  { value: "America/New_York", label: "New York (EST/EDT)", short: "ET" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)", short: "CT" },
  { value: "Europe/London", label: "London (GMT/BST)", short: "UK" },
  { value: "Asia/Dubai", label: "Dubai (GST)", short: "GST" },
  { value: "Asia/Karachi", label: "Karachi (PKT)", short: "PKT" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)", short: "UTC" },
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number]["value"];

export const SUPPORTED_TIMEZONE_VALUES = SUPPORTED_TIMEZONES.map((t) => t.value);

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const BOOKING_STATUSES = ["confirmed", "rescheduled", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ["sandbox_paid", "unpaid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SERVICE_CATEGORIES = [
  "Strategy & Advisory",
  "Design & Architecture",
  "Clinical & Wellness",
  "Executive Coaching",
  "Technical Audit",
] as const;

export const AVATAR_COLORS = [
  "#2563eb",
  "#0f766e",
  "#4f46e5",
  "#b45309",
  "#be123c",
  "#334155",
] as const;

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
