import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import type { FlowEdge, FlowNode } from "@/lib/types";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("operator"),
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

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Operations"),
  triggerType: text("trigger_type").notNull().default("trigger"),
  active: boolean("active").notNull().default(true),
  isTemplate: boolean("is_template").notNull().default(false),
  nodesJson: jsonb("nodes_json").$type<FlowNode[]>().notNull().default([]),
  edgesJson: jsonb("edges_json").$type<FlowEdge[]>().notNull().default([]),
  samplePayload: jsonb("sample_payload").$type<Record<string, unknown>>().notNull().default({}),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  workflowName: text("workflow_name").notNull(),
  status: text("status").notNull().default("running"),
  triggerType: text("trigger_type").notNull().default("trigger"),
  triggerPayload: jsonb("trigger_payload").$type<Record<string, unknown>>().notNull().default({}),
  contextJson: jsonb("context_json").$type<Record<string, unknown>>().notNull().default({}),
  outputJson: jsonb("output_json").$type<Record<string, unknown>>().notNull().default({}),
  pausedNodeId: text("paused_node_id"),
  approvalPrompt: text("approval_prompt"),
  approvedBy: text("approved_by"),
  approvalNote: text("approval_note"),
  retryCount: integer("retry_count").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const runSteps = pgTable("run_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => workflowRuns.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull().default(0),
  nodeId: text("node_id").notNull(),
  nodeType: text("node_type").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull().default("completed"),
  inputJson: jsonb("input_json").$type<Record<string, unknown>>().notNull().default({}),
  outputJson: jsonb("output_json").$type<Record<string, unknown>>().notNull().default({}),
  durationMs: integer("duration_ms").notNull().default(0),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  endpointUrl: text("endpoint_url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  description: text("description").notNull().default(""),
  configJson: jsonb("config_json").$type<Record<string, unknown>>().notNull().default({}),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  lastStatus: text("last_status").notNull().default("untested"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
