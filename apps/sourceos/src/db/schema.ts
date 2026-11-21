import {
  bigint,
  boolean,
  doublePrecision,
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
  role: text("role").notNull().default("buyer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  category: text("category").notNull(),
  qualificationStatus: text("qualification_status").notNull().default("under_review"),
  leadTimeDays: integer("lead_time_days").notNull().default(21),
  onTimePct: doublePrecision("on_time_pct").notNull().default(95.0),
  defectRatePct: doublePrecision("defect_rate_pct").notNull().default(0.8),
  certifications: text("certifications").notNull().default("ISO 9001"),
  rating: doublePrecision("rating").notNull().default(4.4),
  contactEmail: text("contact_email").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rfqs = pgTable("rfqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfqNumber: text("rfq_number").notNull().unique(),
  title: text("title").notNull(),
  targetQty: integer("target_qty").notNull(),
  targetUnitCents: integer("target_unit_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("open"),
  dueDate: text("due_date").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotations = pgTable("quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfqId: uuid("rfq_id")
    .notNull()
    .references(() => rfqs.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  unitPriceCents: integer("unit_price_cents").notNull(),
  moq: integer("moq").notNull().default(100),
  leadTimeDays: integer("lead_time_days").notNull().default(21),
  incoterms: text("incoterms").notNull().default("FOB"),
  freightEstimateCents: integer("freight_estimate_cents").notNull().default(0),
  selected: boolean("selected").notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  rfqId: uuid("rfq_id").references(() => rfqs.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitCostCents: integer("unit_cost_cents").notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  incoterms: text("incoterms").notNull().default("FOB"),
  status: text("status").notNull().default("ordered"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shipments = pgTable("shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackingCode: text("tracking_code").notNull().unique(),
  poId: uuid("po_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  carrier: text("carrier").notNull(),
  mode: text("mode").notNull().default("sea"),
  originPort: text("origin_port").notNull(),
  destPort: text("dest_port").notNull(),
  status: text("status").notNull().default("booked"),
  etaDate: text("eta_date").notNull(),
  freightCents: integer("freight_cents").notNull().default(0),
  insuranceCents: integer("insurance_cents").notNull().default(0),
  dutyCents: integer("duty_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landedCostScenarios = pgTable("landed_cost_scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  productPriceCents: integer("product_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
  freightCents: integer("freight_cents").notNull().default(0),
  insuranceCents: integer("insurance_cents").notNull().default(0),
  customsDutyPct: doublePrecision("customs_duty_pct").notNull().default(0),
  otherExpensesCents: integer("other_expenses_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  exchangeRateToUsd: doublePrecision("exchange_rate_to_usd").notNull().default(1.0),
  totalLandedUsdCents: bigint("total_landed_usd_cents", { mode: "number" }).notNull(),
  perUnitLandedUsdCents: integer("per_unit_landed_usd_cents").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  docType: text("doc_type").notNull(),
  entityRef: text("entity_ref").notNull(),
  status: text("status").notNull().default("pending_review"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QualificationStatus = "approved" | "under_review" | "probation";
export type RfqStatus = "open" | "evaluating" | "awarded";
export type PoStatus = "ordered" | "in_production" | "shipped" | "delivered";
export type ShipmentMode = "sea" | "air" | "express";
export type ShipmentStatus = "booked" | "in_transit" | "customs" | "delivered";
export type DocType =
  | "commercial_invoice"
  | "packing_list"
  | "bill_of_lading"
  | "certificate_of_origin"
  | "qc_report";
export type DocStatus = "pending_review" | "submitted" | "verified";
