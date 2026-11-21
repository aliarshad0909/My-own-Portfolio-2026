export const TICKET_CATEGORIES = [
  "billing",
  "technical",
  "onboarding",
  "feature_request",
  "incident",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const PLAN_TIERS = ["starter", "growth", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const SUPPORT_AGENTS = [
  "Maya Lin (Lead Agent)",
  "Priya Nair",
  "Carlos Vega",
  "Daniel Okafor",
] as const;

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  billing: "Billing",
  technical: "Technical",
  onboarding: "Onboarding",
  feature_request: "Feature Request",
  incident: "Incident",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export const SLA_POLICY_HOURS: Record<TicketPriority, { firstResponseHours: number; resolutionHours: number; description: string }> = {
  urgent: {
    firstResponseHours: 1,
    resolutionHours: 4,
    description: "Production outages, critical auth failures, or enterprise blockers.",
  },
  high: {
    firstResponseHours: 4,
    resolutionHours: 12,
    description: "Degraded workflows, billing discrepancies, or key integration errors.",
  },
  medium: {
    firstResponseHours: 12,
    resolutionHours: 24,
    description: "Standard technical questions, onboarding setup, and configuration help.",
  },
  low: {
    firstResponseHours: 24,
    resolutionHours: 72,
    description: "Product feedback, roadmap suggestions, and general inquiries.",
  },
};
