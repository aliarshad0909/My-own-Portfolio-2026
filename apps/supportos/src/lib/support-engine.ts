import {
  SLA_POLICY_HOURS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/constants";
import type { KbArticleRow, TicketMessageRow, TicketRow } from "@/db/schema";

export type SlaState = "on_track" | "at_risk" | "breached" | "met" | "breached_resolved";

export type SlaComputation = {
  state: SlaState;
  label: string;
  remainingMinutes: number;
};

const CATEGORY_KEYWORDS: Array<{ category: TicketCategory; terms: string[] }> = [
  {
    category: "incident",
    terms: [
      "outage",
      "down",
      "500",
      "502",
      "503",
      "production down",
      "crash",
      "unavailable",
      "incident",
      "emergency",
      "service disruption",
      "latency spike",
    ],
  },
  {
    category: "billing",
    terms: [
      "invoice",
      "charge",
      "charged",
      "refund",
      "billing",
      "subscription",
      "credit card",
      "payment",
      "receipt",
      "plan",
      "seat",
      "upgrade",
      "downgrade",
      "prorat",
    ],
  },
  {
    category: "onboarding",
    terms: [
      "onboard",
      "getting started",
      "sso",
      "saml",
      "okta",
      "import",
      "migrat",
      "invite team",
      "workspace setup",
      "provision",
      "configure",
    ],
  },
  {
    category: "feature_request",
    terms: [
      "feature request",
      "roadmap",
      "enhancement",
      "would love",
      "suggestion",
      "dark mode",
      "custom field",
      "export csv",
      "add support for",
    ],
  },
];

/**
 * Deterministic keyword-based ticket auto-categorizer used for incoming Customer Portal
 * tickets and auto-routing rules.
 */
export function autoCategorizeTicket(subject: string, description: string): TicketCategory {
  const haystack = `${subject} ${description}`.toLowerCase();
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.terms.some((term) => haystack.includes(term))) {
      return rule.category;
    }
  }
  return "technical";
}

/**
 * Calculates the SLA due timestamp from ticket creation time and priority policy.
 */
export function calculateSlaDueAt(priority: TicketPriority, fromDate: Date = new Date()): Date {
  const policy = SLA_POLICY_HOURS[priority] ?? SLA_POLICY_HOURS.medium;
  return new Date(fromDate.getTime() + policy.firstResponseHours * 3_600_000);
}

/**
 * Computes current SLA compliance state and human-readable countdown/breach label.
 */
export function computeSlaStatus(
  ticket: Pick<TicketRow, "status" | "slaDueAt" | "resolvedAt" | "firstRespondedAt" | "priority">,
  now: Date = new Date(),
): SlaComputation {
  const dueMs = new Date(ticket.slaDueAt).getTime();
  const nowMs = now.getTime();
  const isClosed = ticket.status === "resolved" || ticket.status === "closed";

  // First-response SLA is finalized once an agent sends a public reply, regardless of
  // whether the ticket remains open, in_progress, waiting_customer, resolved, or closed.
  if (ticket.firstRespondedAt) {
    const respondedMs = new Date(ticket.firstRespondedAt).getTime();
    if (respondedMs <= dueMs) {
      return { state: "met", label: "SLA Met", remainingMinutes: 0 };
    }
    const overMins = Math.max(1, Math.round((respondedMs - dueMs) / 60_000));
    if (isClosed) {
      return {
        state: "breached_resolved",
        label: `Resolved ${formatDurationMinutes(overMins)} after SLA`,
        remainingMinutes: -overMins,
      };
    }
    return {
      state: "breached",
      label: `Responded ${formatDurationMinutes(overMins)} after SLA`,
      remainingMinutes: -overMins,
    };
  }

  if (isClosed) {
    const completedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : nowMs;
    if (completedAt <= dueMs) {
      return { state: "met", label: "SLA Met", remainingMinutes: 0 };
    }
    const overMins = Math.max(1, Math.round((completedAt - dueMs) / 60_000));
    return {
      state: "breached_resolved",
      label: `Resolved ${formatDurationMinutes(overMins)} after SLA`,
      remainingMinutes: -overMins,
    };
  }

  if (nowMs > dueMs) {
    const overMins = Math.max(1, Math.round((nowMs - dueMs) / 60_000));
    return {
      state: "breached",
      label: `Breached ${formatDurationMinutes(overMins)} ago`,
      remainingMinutes: -overMins,
    };
  }

  const diffMins = Math.max(0, Math.round((dueMs - nowMs) / 60_000));
  const policyHours = SLA_POLICY_HOURS[(ticket.priority as TicketPriority) || "medium"]?.firstResponseHours ?? 12;
  const atRiskThresholdMins = Math.min(120, Math.max(30, policyHours * 60 * 0.35));

  if (diffMins <= atRiskThresholdMins) {
    return {
      state: "at_risk",
      label: `Due in ${formatDurationMinutes(diffMins)}`,
      remainingMinutes: diffMins,
    };
  }

  return {
    state: "on_track",
    label: `${formatDurationMinutes(diffMins)} left`,
    remainingMinutes: diffMins,
  };
}

export function formatDurationMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) {
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type AiDraftResult = {
  draft: string;
  matchedArticles: Array<{ id: string; title: string; slug: string; category: string }>;
  autoSent: false;
  reasoning: string;
};

/**
 * Deterministic AI Draft Suggestion engine grounded in ticket metadata,
 * recent customer message, and published Knowledge Base articles.
 *
 * Strictly read-only: produces an editable draft string and NEVER auto-sends.
 */
export function generateAiDraftSuggestion(params: {
  ticket: Pick<TicketRow, "ticketNumber" | "subject" | "description" | "category" | "priority">;
  customerName: string;
  customerCompany: string;
  customerPlan: string;
  latestCustomerMessage?: string;
  kbArticles: Array<Pick<KbArticleRow, "id" | "slug" | "title" | "category" | "summary" | "body" | "published">>;
}): AiDraftResult {
  const { ticket, customerName, customerCompany, customerPlan, latestCustomerMessage, kbArticles } = params;
  const firstName = customerName.trim().split(/\s+/)[0] || "there";

  const queryText = `${ticket.subject} ${ticket.description} ${latestCustomerMessage ?? ""}`.toLowerCase();
  const tokens = Array.from(
    new Set(
      queryText
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3 && !STOP_WORDS.has(t)),
    ),
  );

  const published = kbArticles.filter((a) => a.published);
  const scored = published
    .map((article) => {
      let score = article.category === ticket.category ? 6 : 0;
      const articleHaystack = `${article.title} ${article.summary} ${article.body}`.toLowerCase();
      for (const token of tokens) {
        if (articleHaystack.includes(token)) {
          score += article.title.toLowerCase().includes(token) ? 4 : 2;
        }
      }
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const matchedArticles = scored.map(({ article }) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category,
  }));

  const categoryGuidance: Record<TicketCategory, string> = {
    billing:
      "I have reviewed your workspace billing ledger and subscription state. Please confirm the invoice number or last four digits of the card if you need a prorated adjustment or credit memo issued right away.",
    technical:
      "I reviewed the technical details you shared and checked our latest diagnostics. Could you confirm your workspace region and whether any recent token or webhook endpoint changes occurred before the error started?",
    onboarding:
      "We would love to get your team smoothly configured. I have outlined the recommended workspace setup steps below, and our onboarding specialists can also run a quick live verification once you apply them.",
    feature_request:
      "Thank you for sharing this workflow feedback! I have logged your request alongside your account context for our Product Engineering review and linked it to your organization so we notify you on roadmap updates.",
    incident:
      "We are treating this as a high-priority service investigation for your organization. Our engineering team is actively tracing the root cause and will share the next milestone update within 30 minutes.",
  };

  const priorityNote =
    ticket.priority === "urgent"
      ? `Because this is marked Urgent on your ${customerPlan.toUpperCase()} plan, I have escalated it to our priority queue.`
      : ticket.priority === "high"
        ? `I have prioritized this ticket under your ${customerPlan.toUpperCase()} SLA commitment.`
        : "";

  const kbSection =
    scored.length > 0
      ? [
          "",
          "Relevant Knowledge Base guidance:",
          ...scored.map(
            ({ article }) =>
              `• ${article.title}: ${article.summary}`,
          ),
        ].join("\n")
      : "";

  const draftLines = [
    `Hi ${firstName},`,
    "",
    `Thanks for reaching out regarding "${ticket.subject}" (${ticket.ticketNumber}) for ${customerCompany}.`,
    priorityNote ? `\n${priorityNote}` : "",
    "",
    categoryGuidance[(ticket.category as TicketCategory) || "technical"],
    kbSection,
    "",
    "Please reply directly to this thread with any additional screenshots or logs, and I will follow up right away.",
    "",
    "Best regards,",
    "SupportOS Customer Engineering",
  ]
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n");

  const reasoning =
    matchedArticles.length > 0
      ? `Grounded in category "${ticket.category}" (${ticket.priority} priority) and ${matchedArticles.length} matching KB article${matchedArticles.length > 1 ? "s" : ""}.`
      : `Grounded in category "${ticket.category}" (${ticket.priority} priority) playbook.`;

  return {
    draft: draftLines,
    matchedArticles,
    autoSent: false,
    reasoning,
  };
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "when",
  "our",
  "your",
  "are",
  "was",
  "were",
  "can",
  "not",
  "but",
  "into",
  "about",
  "please",
  "help",
  "need",
]);

export type AgentPerformanceRow = {
  agentName: string;
  assignedCount: number;
  openCount: number;
  resolvedCount: number;
  avgFirstResponseMinutes: number | null;
  slaCompliancePct: number;
  internalNotesCount: number;
};

export type SupportAnalytics = {
  kpis: {
    totalTickets: number;
    openTickets: number;
    slaAtRiskCount: number;
    slaBreachedCount: number;
    avgFirstResponseMinutes: number;
    resolvedTickets: number;
    publishedKbArticles: number;
    slaCompliancePct: number;
  };
  byPriority: Array<{ priority: TicketPriority; count: number; breached: number; atRisk: number }>;
  byCategory: Array<{ category: TicketCategory; count: number }>;
  byStatus: Array<{ status: TicketStatus; count: number }>;
  agentPerformance: AgentPerformanceRow[];
};

export function computeSupportAnalytics(params: {
  tickets: TicketRow[];
  messages: TicketMessageRow[];
  kbArticles: KbArticleRow[];
  now?: Date;
}): SupportAnalytics {
  const { tickets, messages, kbArticles, now = new Date() } = params;

  let openTickets = 0;
  let resolvedTickets = 0;
  let slaAtRiskCount = 0;
  let slaBreachedCount = 0;
  let slaCompliantTotal = 0;
  const firstResponseSamples: number[] = [];

  const priorityCounts = new Map<TicketPriority, { count: number; breached: number; atRisk: number }>();
  for (const p of TICKET_PRIORITIES) {
    priorityCounts.set(p, { count: 0, breached: 0, atRisk: 0 });
  }

  const categoryCounts = new Map<TicketCategory, number>();
  for (const c of TICKET_CATEGORIES) {
    categoryCounts.set(c, 0);
  }

  const statusCounts = new Map<TicketStatus, number>([
    ["open", 0],
    ["in_progress", 0],
    ["waiting_customer", 0],
    ["resolved", 0],
    ["closed", 0],
  ]);

  const notesByAuthor = new Map<string, number>();
  for (const msg of messages) {
    if (msg.isInternalNote) {
      notesByAuthor.set(msg.authorName, (notesByAuthor.get(msg.authorName) ?? 0) + 1);
    }
  }

  const agentMap = new Map<
    string,
    {
      assignedCount: number;
      openCount: number;
      resolvedCount: number;
      frtMinutes: number[];
      slaMet: number;
    }
  >();

  for (const ticket of tickets) {
    const status = ticket.status as TicketStatus;
    const priority = ticket.priority as TicketPriority;
    const category = ticket.category as TicketCategory;

    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);

    const pEntry = priorityCounts.get(priority) ?? { count: 0, breached: 0, atRisk: 0 };
    pEntry.count += 1;

    const sla = computeSlaStatus(ticket, now);
    const isClosed = status === "resolved" || status === "closed";

    if (isClosed) {
      resolvedTickets += 1;
    } else {
      openTickets += 1;
    }

    if (sla.state === "breached") {
      slaBreachedCount += 1;
      pEntry.breached += 1;
    } else if (sla.state === "at_risk") {
      slaAtRiskCount += 1;
      pEntry.atRisk += 1;
    }

    const isCompliant = sla.state === "met" || sla.state === "on_track" || sla.state === "at_risk";
    if (isCompliant) {
      slaCompliantTotal += 1;
    }
    priorityCounts.set(priority, pEntry);

    let frtMins: number | null = null;
    if (ticket.firstRespondedAt) {
      frtMins = Math.max(
        1,
        Math.round(
          (new Date(ticket.firstRespondedAt).getTime() - new Date(ticket.createdAt).getTime()) /
            60_000,
        ),
      );
      firstResponseSamples.push(frtMins);
    }

    const agentName = ticket.assignedAgentName || "Unassigned";
    const ag = agentMap.get(agentName) ?? {
      assignedCount: 0,
      openCount: 0,
      resolvedCount: 0,
      frtMinutes: [],
      slaMet: 0,
    };
    ag.assignedCount += 1;
    if (isClosed) ag.resolvedCount += 1;
    else ag.openCount += 1;
    if (frtMins !== null) ag.frtMinutes.push(frtMins);
    if (isCompliant) ag.slaMet += 1;
    agentMap.set(agentName, ag);
  }

  const avgFirstResponseMinutes =
    firstResponseSamples.length > 0
      ? Math.round(
          firstResponseSamples.reduce((sum, v) => sum + v, 0) / firstResponseSamples.length,
        )
      : 0;

  const slaCompliancePct =
    tickets.length > 0 ? Math.round((slaCompliantTotal / tickets.length) * 100) : 100;

  const agentPerformance: AgentPerformanceRow[] = Array.from(agentMap.entries())
    .map(([agentName, stats]) => ({
      agentName,
      assignedCount: stats.assignedCount,
      openCount: stats.openCount,
      resolvedCount: stats.resolvedCount,
      avgFirstResponseMinutes:
        stats.frtMinutes.length > 0
          ? Math.round(stats.frtMinutes.reduce((a, b) => a + b, 0) / stats.frtMinutes.length)
          : null,
      slaCompliancePct:
        stats.assignedCount > 0 ? Math.round((stats.slaMet / stats.assignedCount) * 100) : 100,
      internalNotesCount: notesByAuthor.get(agentName) ?? 0,
    }))
    .sort((a, b) => b.assignedCount - a.assignedCount);

  return {
    kpis: {
      totalTickets: tickets.length,
      openTickets,
      slaAtRiskCount,
      slaBreachedCount,
      avgFirstResponseMinutes,
      resolvedTickets,
      publishedKbArticles: kbArticles.filter((a) => a.published).length,
      slaCompliancePct,
    },
    byPriority: TICKET_PRIORITIES.map((priority) => {
      const entry = priorityCounts.get(priority) ?? { count: 0, breached: 0, atRisk: 0 };
      return { priority, ...entry };
    }),
    byCategory: TICKET_CATEGORIES.map((category) => ({
      category,
      count: categoryCounts.get(category) ?? 0,
    })),
    byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
    agentPerformance,
  };
}
