export const DEAL_STAGES = [
  { id: "new_lead", label: "New Lead", probability: 15, color: "#64748b" },
  { id: "qualified", label: "Qualified", probability: 35, color: "#3b82f6" },
  { id: "proposal", label: "Proposal", probability: 60, color: "#6366f1" },
  { id: "negotiation", label: "Negotiation", probability: 80, color: "#f59e0b" },
  { id: "won", label: "Won", probability: 100, color: "#10b981" },
  { id: "lost", label: "Lost", probability: 0, color: "#ef4444" },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]["id"];

export const CONTACT_STATUSES = [
  { id: "active", label: "Active" },
  { id: "prospect", label: "Prospect" },
  { id: "customer", label: "Customer" },
  { id: "inactive", label: "Inactive" },
] as const;

export const CONTACT_CATEGORIES = [
  { id: "decision_maker", label: "Decision Maker" },
  { id: "champion", label: "Champion" },
  { id: "influencer", label: "Influencer" },
  { id: "partner", label: "Partner" },
  { id: "customer", label: "Customer" },
] as const;

export const LEAD_SOURCES = [
  { id: "website", label: "Website Inbound" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "referral", label: "Referral" },
  { id: "outbound", label: "Outbound" },
  { id: "event", label: "Event / Webinar" },
  { id: "partner", label: "Partner" },
] as const;

export const LEAD_STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "unqualified", label: "Unqualified" },
  { id: "converted", label: "Converted" },
] as const;

export const ACTIVITY_TYPES = [
  { id: "call", label: "Call" },
  { id: "meeting", label: "Meeting" },
  { id: "email", label: "Email" },
  { id: "follow_up", label: "Follow-up" },
  { id: "note", label: "Note" },
] as const;

export function stageLabel(stage: string): string {
  return DEAL_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function stageProbability(stage: string): number {
  return DEAL_STAGES.find((s) => s.id === stage)?.probability ?? 20;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

