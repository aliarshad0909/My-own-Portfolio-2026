import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ColumnMeta,
  DashboardConfig,
  DatasetCategory,
  DatasetSourceType,
  RowData,
  ValidationSummary,
} from "@/lib/types";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("analyst"),
  passwordHash: text("password_hash").notNull(),
  avatarColor: text("avatar_color").notNull().default("#06b6d4"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

export const datasets = pgTable(
  "datasets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    category: text("category").$type<DatasetCategory>().notNull().default("custom"),
    sourceType: text("source_type").$type<DatasetSourceType>().notNull().default("csv_upload"),
    description: text("description").notNull().default(""),
    columnsJson: jsonb("columns_json").$type<ColumnMeta[]>().notNull(),
    rowCount: integer("row_count").notNull().default(0),
    validationSummary: jsonb("validation_summary").$type<ValidationSummary>().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("datasets_category_idx").on(t.category)],
);

export const datasetRows = pgTable(
  "dataset_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    rowIndex: integer("row_index").notNull(),
    dataJson: jsonb("data_json").$type<RowData>().notNull(),
  },
  (t) => [index("dataset_rows_dataset_idx").on(t.datasetId, t.rowIndex)],
);

export const savedDashboards = pgTable(
  "saved_dashboards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    description: text("description").notNull().default(""),
    configJson: jsonb("config_json").$type<DashboardConfig>().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("saved_dashboards_dataset_idx").on(t.datasetId)],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_logs_created_idx").on(t.createdAt)],
);
