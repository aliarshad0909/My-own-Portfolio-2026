import { z } from "zod";
import {
  PLAN_TIERS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required.").max(120),
  email: z.string().trim().email("Valid customer email is required.").max(160),
  company: z.string().trim().min(1, "Company name is required.").max(140),
  planTier: z.enum(PLAN_TIERS).default("growth"),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createTicketSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().trim().min(2).max(120).optional(),
  customerEmail: z.string().trim().email().max(160).optional(),
  customerCompany: z.string().trim().max(140).optional(),
  subject: z.string().trim().min(4, "Subject must be at least 4 characters.").max(180),
  description: z.string().trim().min(10, "Please describe the issue (at least 10 characters).").max(5000),
  category: z.enum([...TICKET_CATEGORIES, "auto"] as const).optional().default("auto"),
  priority: z.enum(TICKET_PRIORITIES).optional().default("medium"),
  assignedAgentName: z.string().trim().max(120).nullable().optional(),
  source: z.enum(["agent", "portal"]).optional().default("agent"),
});

export const updateTicketSchema = z.object({
  subject: z.string().trim().min(4).max(180).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  assignedAgentName: z.string().trim().max(120).nullable().optional(),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(2, "Message cannot be empty.").max(6000),
  isInternalNote: z.boolean().optional().default(false),
  authorRole: z.enum(["agent", "customer"]).optional().default("agent"),
  authorName: z.string().trim().min(1).max(120).optional(),
  nextStatus: z.enum(TICKET_STATUSES).optional(),
});

export const createCannedResponseSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  shortcut: z
    .string()
    .trim()
    .min(2, "Shortcut is required (e.g. /refund).")
    .max(48)
    .transform((s) => (s.startsWith("/") ? s.toLowerCase() : `/${s.toLowerCase()}`)),
  category: z.enum(TICKET_CATEGORIES).default("technical"),
  body: z.string().trim().min(8, "Response body must be at least 8 characters.").max(4000),
});

export const updateCannedResponseSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  shortcut: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .transform((s) => (s.startsWith("/") ? s.toLowerCase() : `/${s.toLowerCase()}`))
    .optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  body: z.string().trim().min(8).max(4000).optional(),
});

export const createKbArticleSchema = z.object({
  title: z.string().trim().min(4, "Article title is required.").max(180),
  slug: z.string().trim().min(2).max(180).optional(),
  category: z.enum(TICKET_CATEGORIES).default("technical"),
  summary: z.string().trim().min(8, "Summary is required.").max(500),
  body: z.string().trim().min(20, "Article body must be at least 20 characters.").max(12000),
  published: z.boolean().optional().default(true),
});

export const updateKbArticleSchema = createKbArticleSchema.partial().extend({
  incrementViews: z.boolean().optional(),
});
