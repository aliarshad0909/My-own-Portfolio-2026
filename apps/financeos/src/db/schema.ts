import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("demo"),
  passwordHash: text("password_hash").notNull(),
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

/** Customer (AR) and Vendor (AP) business counterparties. */
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // "customer" | "vendor"
  name: text("name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  paymentTermsDays: integer("payment_terms_days").notNull().default(30),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Ledger records covering sales/income, operating expenses, and COGS purchases. */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // "income" | "expense" | "purchase" | "sale"
  category: text("category").notNull(),
  description: text("description").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  reference: text("reference").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  exchangeRate: real("exchange_rate").notNull().default(1),
  amountCents: integer("amount_cents").notNull(),
  baseAmountCents: integer("base_amount_cents").notNull(),
  status: text("status").notNull().default("cleared"), // "cleared" | "pending"
  reconciled: integer("reconciled").notNull().default(0), // 0 | 1
  occurredAt: text("occurred_at").notNull(), // YYYY-MM-DD
  createdBy: text("created_by").notNull().default("System"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** AR Customer Invoices & AP Vendor Bills. */
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  direction: text("direction").notNull().default("receivable"), // "receivable" (AR) | "payable" (AP)
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("draft"), // "draft" | "sent" | "paid" | "overdue"
  currency: text("currency").notNull().default("USD"),
  exchangeRate: real("exchange_rate").notNull().default(1),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  taxRatePct: real("tax_rate_pct").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  baseTotalCents: integer("base_total_cents").notNull().default(0),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  paidAt: text("paid_at"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  lineTotalCents: integer("line_total_cents").notNull().default(0),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull().unique(),
  monthlyLimitCents: integer("monthly_limit_cents").notNull(),
  period: text("period").notNull().default("2026-Q4"),
  ownerName: text("owner_name").notNull().default("Finance Ops"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const currencyRates = pgTable("currency_rates", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  rateToUsd: real("rate_to_usd").notNull(),
  note: text("note").notNull().default("User-configured demonstration rate"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bankStatements = pgTable("bank_statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  statementDate: text("statement_date").notNull(),
  description: text("description").notNull(),
  reference: text("reference").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  amountCents: integer("amount_cents").notNull(), // positive = credit/inflow, negative = debit/outflow
  status: text("status").notNull().default("unmatched"), // "unmatched" | "reconciled"
  matchedTransactionId: uuid("matched_transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull().default(""),
  summary: text("summary").notNull(),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
