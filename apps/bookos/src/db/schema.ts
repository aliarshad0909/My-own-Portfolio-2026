import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'staff' | 'demo'
  avatarColor: text("avatar_color").notNull().default("#2563eb"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("Consultation"),
  durationMins: integer("duration_mins").notNull(),
  bufferMins: integer("buffer_mins").notNull().default(10),
  priceCents: integer("price_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  roleTitle: text("role_title").notNull(),
  email: text("email").notNull().unique(),
  timezone: text("timezone").notNull().default("America/New_York"),
  bio: text("bio").notNull().default(""),
  avatarColor: text("avatar_color").notNull().default("#2563eb"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0..6 (Sun..Sat)
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  timezone: text("timezone").notNull().default("America/New_York"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingRef: text("booking_ref").notNull().unique(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  startUtc: timestamp("start_utc", { withTimezone: true }).notNull(),
  endUtc: timestamp("end_utc", { withTimezone: true }).notNull(),
  customerTimezone: text("customer_timezone").notNull().default("America/New_York"),
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'
  paymentStatus: text("payment_status").notNull().default("unpaid"), // 'sandbox_paid' | 'unpaid' | 'refunded'
  paymentAmountCents: integer("payment_amount_cents").notNull().default(0),
  paymentReceiptRef: text("payment_receipt_ref"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // 'email' | 'sms'
  scheduledForUtc: timestamp("scheduled_for_utc", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'sent'
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
