import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("demo"),
  passwordHash: text("password_hash").notNull(),
  avatarColor: text("avatar_color").notNull().default("#16a34a"),
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

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  headName: text("head_name").notNull(),
  headcountTarget: integer("headcount_target").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  title: text("title").notNull(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "restrict" }),
  managerId: uuid("manager_id").references((): AnyPgColumn => employees.id, { onDelete: "set null" }),
  employmentType: text("employment_type").notNull().default("full_time"),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull(),
  location: text("location").notNull(),
  leaveBalanceDays: integer("leave_balance_days").notNull().default(18),
  compensationBandPrivate: text("compensation_band_private").notNull(),
  emergencyContactPrivate: text("emergency_contact_private").notNull(),
  hrNotesPrivate: text("hr_notes_private").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    logDate: text("log_date").notNull(),
    status: text("status").notNull().default("present"),
    checkInTime: text("check_in_time").notNull().default("09:00"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("attendance_logs_employee_date_uq").on(table.employeeId, table.logDate)],
);

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveType: text("leave_type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  daysRequested: integer("days_requested").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  roleTitle: text("role_title").notNull(),
  departmentName: text("department_name").notNull(),
  stage: text("stage").notNull().default("applied"),
  source: text("source").notNull().default("Direct Application"),
  rating: integer("rating").notNull().default(3),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const onboardingTasks = pgTable("onboarding_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  ownerRole: text("owner_role").notNull().default("HR Ops"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const performanceReviews = pgTable("performance_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  cycle: text("cycle").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  rating: integer("rating").notNull(),
  summary: text("summary").notNull(),
  goals: text("goals").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employeeDocuments = pgTable("employee_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  docType: text("doc_type").notNull(),
  status: text("status").notNull().default("verified"),
  uploadedDate: text("uploaded_date").notNull(),
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
