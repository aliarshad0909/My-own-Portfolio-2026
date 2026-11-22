import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("pm"),
  passwordHash: text("password_hash").notNull(),
  avatarColor: text("avatar_color").notNull().default("#7c3aed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  roleTitle: text("role_title").notNull(),
  email: text("email").notNull().unique(),
  capacityHours: integer("capacity_hours").notNull().default(40),
  avatarColor: text("avatar_color").notNull().default("#8b5cf6"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  budgetHours: integer("budget_hours").notNull().default(120),
  startDate: text("start_date").notNull(),
  targetDate: text("target_date").notNull(),
  clientPortalEnabled: boolean("client_portal_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  stage: text("stage").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  assigneeName: text("assignee_name").notNull().default("Unassigned"),
  dependsOnTaskId: uuid("depends_on_task_id").references((): AnyPgColumn => tasks.id, {
    onDelete: "set null",
  }),
  estimatedHours: doublePrecision("estimated_hours").notNull().default(4),
  dueDate: text("due_date").notNull().default(""),
  attachmentName: text("attachment_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskComments = pgTable("task_comments", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  memberName: text("member_name").notNull(),
  hours: doublePrecision("hours").notNull(),
  billable: boolean("billable").notNull().default(true),
  note: text("note").notNull().default(""),
  loggedDate: text("logged_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityTitle: text("entity_title").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type TeamMemberRow = typeof teamMembers.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type MilestoneRow = typeof milestones.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type TaskCommentRow = typeof taskComments.$inferSelect;
export type TimeEntryRow = typeof timeEntries.$inferSelect;
export type ActivityLogRow = typeof activityLogs.$inferSelect;
