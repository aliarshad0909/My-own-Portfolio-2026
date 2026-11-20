import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("demo"), // 'admin' | 'sales_rep' | 'demo'
  passwordHash: text("password_hash").notNull(),
  avatarColor: text("avatar_color").notNull().default("#4f46e5"),
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

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default("Technology"),
  website: text("website").notNull().default(""),
  size: text("size").notNull().default("11-50"),
  location: text("location").notNull().default(""),
  annualRevenue: integer("annual_revenue").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  title: text("title").notNull().default(""),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  companyName: text("company_name").notNull().default(""),
  status: text("status").notNull().default("active"), // 'active' | 'prospect' | 'customer' | 'inactive'
  category: text("category").notNull().default("decision_maker"), // 'decision_maker' | 'champion' | 'influencer' | 'partner' | 'customer'
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  source: text("source").notNull().default("website"), // 'website' | 'referral' | 'linkedin' | 'outbound' | 'event' | 'partner'
  status: text("status").notNull().default("new"), // 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  score: integer("score").notNull().default(50),
  estimatedValue: integer("estimated_value").notNull().default(0),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  convertedDealId: uuid("converted_deal_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  value: integer("value").notNull().default(0),
  stage: text("stage").notNull().default("new_lead"), // 'new_lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability: integer("probability").notNull().default(20),
  expectedCloseDate: text("expected_close_date").notNull().default(""),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyName: text("company_name").notNull().default(""),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const dealHistory = pgTable("deal_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  changedBy: text("changed_by").notNull().default("System"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull().default("call"), // 'call' | 'meeting' | 'email' | 'follow_up' | 'note'
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("pending"), // 'pending' | 'completed'
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealHistoryEntry = typeof dealHistory.$inferSelect;
export type Activity = typeof activities.$inferSelect;

