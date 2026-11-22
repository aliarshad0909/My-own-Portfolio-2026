import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const accountCreateSchema = z.object({
  type: z.enum(["customer", "vendor"]),
  name: z.string().trim().min(2, "Account name is required").max(140),
  contactName: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  currency: z.string().trim().min(3).max(5).default("USD"),
  paymentTermsDays: z.coerce.number().int().min(0).max(180).default(30),
  notes: z.string().trim().max(600).optional().default(""),
});

export const transactionCreateSchema = z.object({
  type: z.enum(["income", "expense", "purchase", "sale"]),
  category: z.string().trim().min(2, "Category is required").max(80),
  description: z.string().trim().min(2, "Description is required").max(200),
  accountId: z.string().uuid().optional().nullable(),
  reference: z.string().trim().max(60).optional().default(""),
  currency: z.string().trim().min(3).max(5).default("USD"),
  exchangeRate: z.coerce.number().positive("Exchange rate must be positive").max(10000).default(1),
  amountCents: z.coerce.number().int().positive("Amount must be greater than zero"),
  status: z.enum(["cleared", "pending"]).default("cleared"),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const invoiceCreateSchema = z.object({
  direction: z.enum(["receivable", "payable"]).default("receivable"),
  accountId: z.string().uuid("Select a customer or vendor account"),
  currency: z.string().trim().min(3).max(5).default("USD"),
  exchangeRate: z.coerce.number().positive().max(10000).default(1),
  taxRatePct: z.coerce.number().min(0).max(50).default(0),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD"),
  notes: z.string().trim().max(600).optional().default(""),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(2).max(160),
        quantity: z.coerce.number().int().min(1).max(100000),
        unitPriceCents: z.coerce.number().int().min(1).max(500_000_000),
      }),
    )
    .min(1, "Add at least one line item"),
});

export const invoiceActionSchema = z.object({
  action: z.enum(["send", "mark_paid", "mark_overdue"]),
});

export const budgetUpsertSchema = z.object({
  category: z.string().trim().min(2).max(80),
  monthlyLimitCents: z.coerce.number().int().positive("Budget limit must be positive"),
  period: z.string().trim().min(2).max(24).default("2026-Q4"),
  ownerName: z.string().trim().max(80).optional().default("Finance Ops"),
});

export const currencyRateSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(5),
  name: z.string().trim().min(2).max(60),
  rateToUsd: z.coerce.number().positive("Rate must be positive").max(10000),
  note: z.string().trim().max(140).optional().default("User-entered rate"),
});

export const csvImportSchema = z.object({
  csvText: z.string().trim().min(10, "Provide CSV statement content").max(200_000),
});

export const reconcileSchema = z.object({
  statementId: z.string().uuid(),
  transactionId: z.string().uuid().optional(),
  createLedgerCategory: z.string().trim().max(80).optional(),
  exchangeRate: z
    .preprocess((val) => {
      if (val === undefined) return undefined;
      if (typeof val === "number") return val;
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return Number.NaN;
    }, z.number().finite("Exchange rate must be a valid positive number").positive("Exchange rate must be greater than zero").max(10000))
    .optional(),
});
