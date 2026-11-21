"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LifeBuoy,
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CategoryBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/Badges";
import { useToast } from "@/components/ToastProvider";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/constants";
import type { SlaComputation } from "@/lib/support-engine";

type CustomerOption = {
  id: string;
  name: string;
  email: string;
  company: string;
  planTier: string;
};

type PortalTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  slaDueAt: string;
  createdAt: string;
  customer: CustomerOption;
  sla: SlaComputation;
};

type PublicMessage = {
  id: string;
  authorName: string;
  authorRole: "customer" | "agent";
  body: string;
  createdAt: string;
};

type KbArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  views: number;
  published: boolean;
};

export function PortalClient() {
  const { pushToast } = useToast();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);

  // Submit form state
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("auto");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    ticketNumber: string;
    category: string;
    slaDueAt: string;
  } | null>(null);

  // Tracker state
  const [trackerFilter, setTrackerFilter] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<PublicMessage[]>([]);
  const [followUpBody, setFollowUpBody] = useState("");
  const [postingFollowUp, setPostingFollowUp] = useState(false);

  // KB search
  const [kbQuery, setKbQuery] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const loadPortalData = useCallback(async () => {
    const [custRes, tickRes, kbRes] = await Promise.all([
      fetch("/api/customers", { cache: "no-store" }),
      fetch("/api/tickets", { cache: "no-store" }),
      fetch("/api/kb?publishedOnly=true", { cache: "no-store" }),
    ]);

    if (custRes.ok) {
      const json = (await custRes.json()) as { customers: CustomerOption[] };
      setCustomers(json.customers);
      setCustomerId((prev) => prev || json.customers[0]?.id || "");
    }
    if (tickRes.ok) {
      const json = (await tickRes.json()) as { tickets: PortalTicket[] };
      setTickets(json.tickets);
      setSelectedTicketId((prev) => prev || json.tickets[0]?.id || null);
    }
    if (kbRes.ok) {
      const json = (await kbRes.json()) as { articles: KbArticle[] };
      setArticles(json.articles);
    }
  }, []);

  const loadPublicThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/tickets/${id}?publicOnly=true`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { messages: PublicMessage[] };
    setThreadMessages(data.messages);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPortalData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPortalData]);

  useEffect(() => {
    if (!selectedTicketId) return;
    const timer = window.setTimeout(() => void loadPublicThread(selectedTicketId), 0);
    return () => window.clearTimeout(timer);
  }, [selectedTicketId, loadPublicThread]);

  const handlePortalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        customerMode === "existing"
          ? {
              customerId,
              subject,
              description,
              priority,
              category,
              source: "portal" as const,
            }
          : {
              customerName,
              customerEmail,
              customerCompany,
              subject,
              description,
              priority,
              category,
              source: "portal" as const,
            };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ticket?: { id: string; ticketNumber: string; category: string; slaDueAt: string };
        error?: string;
      };
      if (!res.ok || !data.ticket) {
        pushToast(data.error || "Unable to submit support request.", "error");
        return;
      }

      setSubmittedTicket(data.ticket);
      setSubject("");
      setDescription("");
      setCategory("auto");
      setPriority("medium");
      setSelectedTicketId(data.ticket.id);
      pushToast(`Ticket ${data.ticket.ticketNumber} submitted to Agent Inbox.`, "success");
      await loadPortalData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerFollowUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !followUpBody.trim()) return;
    const current = tickets.find((t) => t.id === selectedTicketId);
    setPostingFollowUp(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: followUpBody.trim(),
          authorRole: "customer",
          authorName: current?.customer.name || "Portal Customer",
          isInternalNote: false,
        }),
      });
      if (!res.ok) {
        pushToast("Failed to send follow-up reply.", "error");
        return;
      }
      setFollowUpBody("");
      pushToast("Follow-up sent to support team.", "success");
      await Promise.all([loadPublicThread(selectedTicketId), loadPortalData()]);
    } finally {
      setPostingFollowUp(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!trackerFilter.trim()) return true;
    const q = trackerFilter.toLowerCase();
    return `${t.ticketNumber} ${t.subject} ${t.customer.name} ${t.customer.email} ${t.customer.company}`
      .toLowerCase()
      .includes(q);
  });

  const filteredArticles = articles.filter((a) => {
    if (!kbQuery.trim()) return true;
    const q = kbQuery.toLowerCase();
    return `${a.title} ${a.summary} ${a.body} ${a.category}`.toLowerCase().includes(q);
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Customer Portal Hero Banner */}
      <div className="rounded-2xl bg-[#1e1b4b] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200">
              <LifeBuoy className="h-3.5 w-3.5" />
              Customer Self-Service Portal
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              How can we help your team today?
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-indigo-200">
              Submit a new support ticket (auto-categorized with instant SLA targets), track live
              public updates, or search our Help Center knowledge base.
            </p>
          </div>
          <Link
            href="/inbox"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8]"
          >
            Switch to Agent Inbox
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Submission Form + Self-Service KB */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Submit Ticket Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit a Support Request</h2>
              <p className="text-xs text-slate-500">
                Auto-routed to the right queue and immediately visible in the Agent Inbox
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">
              <Sparkles className="h-3 w-3" />
              Auto-SLA
            </span>
          </div>

          {submittedTicket ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Ticket {submittedTicket.ticketNumber} Received!
              </div>
              <p className="mt-1 text-emerald-800">
                Auto-categorized as <strong>{submittedTicket.category}</strong> · SLA response due by{" "}
                <strong>{new Date(submittedTicket.slaDueAt).toLocaleString()}</strong>.
              </p>
              <Link
                href={`/inbox?ticket=${submittedTicket.id}`}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-[#2563eb] hover:underline"
              >
                Inspect in Agent Inbox <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}

          <form onSubmit={handlePortalSubmit} className="mt-4 space-y-4">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomerMode("existing")}
                className={`rounded-lg px-3 py-1.5 ${
                  customerMode === "existing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Existing Account
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("new")}
                className={`rounded-lg px-3 py-1.5 ${
                  customerMode === "new" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                New Customer Email
              </button>
            </div>

            {customerMode === "existing" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Submitting As
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company} · {c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jordan Lee"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Work Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jordan@company.io"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Company</label>
                  <input
                    type="text"
                    required
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="Orbit Labs"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                required
                minLength={4}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Need refund for duplicate October invoice charge"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="auto">Auto-detect from description</option>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Urgency / Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Issue Description
              </label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share steps to reproduce, error codes, or invoice details…"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting Request…" : "Submit Support Ticket"}
            </button>
          </form>
        </section>

        {/* Self-Service Knowledge Base Search */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <BookOpen className="h-5 w-5 text-[#2563eb]" />
                Self-Service Knowledge Base
              </h2>
              <p className="text-xs text-slate-500">
                Instant answers before opening a ticket ({filteredArticles.length} guides)
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              placeholder="Search SAML SSO, billing invoices, webhooks, custom domains…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>

          <div className="inbox-scroll mt-4 max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {filteredArticles.map((art) => {
              const expanded = expandedArticleId === art.id;
              return (
                <div
                  key={art.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition hover:border-blue-300"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedArticleId(expanded ? null : art.id)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CategoryBadge category={art.category} />
                      <span className="text-[11px] text-slate-400">{art.views} views</span>
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-slate-900">{art.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{art.summary}</p>
                  </button>
                  {expanded ? (
                    <div className="mt-3 border-t border-slate-200 pt-3 text-xs whitespace-pre-wrap leading-relaxed text-slate-700">
                      {art.body}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Customer Ticket Tracker */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MessageSquare className="h-5 w-5 text-[#2563eb]" />
              Customer Ticket Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Public customer view — internal agent notes are strictly filtered out
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackerFilter}
              onChange={(e) => setTrackerFilter(e.target.value)}
              placeholder="Filter by ticket #, email, or company…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="inbox-scroll max-h-[380px] space-y-2 overflow-y-auto lg:col-span-5">
            {filteredTickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTicketId(t.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  t.id === selectedTicketId
                    ? "border-[#2563eb] bg-blue-50/60"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#2563eb]">
                    {t.ticketNumber}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {t.subject}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>{t.customer.name}</span>
                  <span>·</span>
                  <span>{t.customer.company}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 bg-[#f8fafc] p-4 lg:col-span-7">
            {!selectedTicket ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Select a ticket to view public conversation updates.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2563eb]">
                        {selectedTicket.ticketNumber}
                      </span>
                      <PriorityBadge priority={selectedTicket.priority} />
                      <CategoryBadge category={selectedTicket.category} />
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTicket.subject}
                    </div>
                  </div>
                  <SlaBadge state={selectedTicket.sla.state} label={selectedTicket.sla.label} />
                </div>

                <div className="inbox-scroll my-3 max-h-56 flex-1 space-y-2.5 overflow-y-auto">
                  {threadMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 text-xs ${
                        m.authorRole === "agent"
                          ? "border-blue-200 bg-blue-50/70"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>
                          {m.authorName}{" "}
                          <span className="font-normal text-slate-500">
                            ({m.authorRole === "agent" ? "Support Team" : "Customer"})
                          </span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {new Date(m.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-slate-700">
                        {m.body}
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCustomerFollowUp} className="flex gap-2">
                  <input
                    type="text"
                    value={followUpBody}
                    onChange={(e) => setFollowUpBody(e.target.value)}
                    placeholder="Add a public customer follow-up message…"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#2563eb]"
                  />
                  <button
                    type="submit"
                    disabled={postingFollowUp || !followUpBody.trim()}
                    className="rounded-xl bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                  >
                    Reply
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
