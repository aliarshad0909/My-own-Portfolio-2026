import { z } from "zod";
import { SUPPORTED_TIMEZONE_VALUES } from "@/lib/constants";

const timezoneSchema = z.string().refine(
  (tz) => {
    if ((SUPPORTED_TIMEZONE_VALUES as readonly string[]).includes(tz)) return true;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IANA timezone." },
);

const timeHHMMSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM 24-hour format.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const createBookingSchema = z.object({
  serviceId: z.string().uuid("Select a valid service."),
  staffId: z.string().uuid("Select a valid staff specialist."),
  startUtc: z.string().datetime({ message: "Select a valid UTC slot timestamp." }),
  customerTimezone: timezoneSchema.default("America/New_York"),
  customerName: z.string().trim().min(2, "Customer full name is required.").max(120),
  customerEmail: z.string().trim().email("Valid customer email is required.").max(180),
  customerPhone: z.string().trim().max(40).optional().default(""),
  notes: z.string().trim().max(600).optional().default(""),
  simulateSandboxPayment: z.boolean().optional().default(true),
});

export const bookingActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reschedule"),
    startUtc: z.string().datetime({ message: "Select a valid new UTC slot timestamp." }),
    staffId: z.string().uuid().optional(),
    customerTimezone: timezoneSchema.optional(),
    notes: z.string().trim().max(600).optional(),
  }),
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().max(300).optional(),
  }),
  z.object({
    action: z.literal("complete"),
  }),
]);

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2, "Service name is required.").max(120),
  category: z.string().trim().min(2).max(80).default("Strategy & Advisory"),
  durationMins: z.coerce.number().int().min(15).max(480),
  bufferMins: z.coerce.number().int().min(0).max(120).default(10),
  priceCents: z.coerce.number().int().min(0).max(10_000_000),
  currency: z.string().trim().length(3).default("USD"),
  description: z.string().trim().max(600).optional().default(""),
  active: z.boolean().optional().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const staffCreateSchema = z.object({
  name: z.string().trim().min(2, "Staff name is required.").max(120),
  roleTitle: z.string().trim().min(2, "Role title is required.").max(120),
  email: z.string().trim().email("Valid email is required.").max(180),
  timezone: timezoneSchema.default("America/New_York"),
  bio: z.string().trim().max(500).optional().default(""),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Valid hex color required.")
    .optional()
    .default("#2563eb"),
  active: z.boolean().optional().default(true),
});

export const staffUpdateSchema = staffCreateSchema.partial();

export const availabilityUpdateSchema = z.object({
  rules: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: timeHHMMSchema,
          endTime: timeHHMMSchema,
        })
        .refine((r) => r.endTime > r.startTime, {
          message: "End time must be after start time.",
        }),
    )
    .max(21),
});

export const customerCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Customer full name is required.").max(120),
  email: z.string().trim().email("Valid email is required.").max(180),
  phone: z.string().trim().max(40).optional().default(""),
  timezone: timezoneSchema.default("America/New_York"),
  notes: z.string().trim().max(600).optional().default(""),
});

export const customerUpdateSchema = customerCreateSchema.partial();
