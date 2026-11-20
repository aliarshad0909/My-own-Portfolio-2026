import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Valid email is required").max(160),
  phone: z.string().trim().max(40).optional().default(""),
  title: z.string().trim().max(100).optional().default(""),
  companyName: z.string().trim().max(120).optional().default(""),
  companyId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "prospect", "customer", "inactive"]).default("active"),
  category: z.enum(["decision_maker", "champion", "influencer", "partner", "customer"]).default("decision_maker"),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1, "Lead name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(160),
  phone: z.string().trim().max(40).optional().default(""),
  companyName: z.string().trim().max(120).optional().default(""),
  source: z.enum(["website", "referral", "linkedin", "outbound", "event", "partner"]).default("website"),
  status: z.enum(["new", "contacted", "qualified", "unqualified", "converted"]).default("new"),
  score: z.coerce.number().int().min(0).max(100).default(50),
  estimatedValue: z.coerce.number().int().min(0).max(100_000_000).default(0),
  ownerId: z.string().uuid().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadConvertSchema = z.object({
  dealTitle: z.string().trim().min(2).max(160).optional(),
  value: z.coerce.number().int().min(0).max(100_000_000).optional(),
  stage: z.enum(["new_lead", "qualified", "proposal", "negotiation"]).default("qualified"),
  expectedCloseDate: z.string().trim().max(30).optional().default(""),
});

export const dealCreateSchema = z.object({
  title: z.string().trim().min(2, "Deal title is required").max(160),
  value: z.coerce.number().int().min(0).max(100_000_000).default(0),
  stage: z.enum(["new_lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("new_lead"),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().trim().max(30).optional().default(""),
  contactId: z.string().uuid().nullable().optional(),
  companyName: z.string().trim().max(120).optional().default(""),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  stageNote: z.string().trim().max(500).optional(),
});

export const activityCreateSchema = z.object({
  type: z.enum(["call", "meeting", "email", "follow_up", "note"]).default("call"),
  title: z.string().trim().min(2, "Activity title is required").max(160),
  description: z.string().trim().max(2000).optional().default(""),
  status: z.enum(["pending", "completed"]).default("pending"),
  dueAt: z.string().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const activityUpdateSchema = activityCreateSchema.partial();

