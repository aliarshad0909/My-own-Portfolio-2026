"use client";

import {
  BookOpen,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CategoryBadge,
  PlanBadge,
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/Badges";
import { useToast } from "@/components/ToastProvider";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  SUPPORT_AGENTS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";
import type { AiDraftResult, SlaComputation } from "@/lib/support-engine";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  company: string;
  planTier: string;
};

type TicketListItem = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedAgentName: string | null;
  slaDueAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
  messageCount: number;
  internalNoteCount: number;
  sla: SlaComputation;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: "customer" | "agent";
  isInternalNote: boolean;
  body: string;
  createdAt: string;
};

type TicketDetailPayload = {
  ticket: TicketListItem & { customer: CustomerSummary & { notes?: string } };
  messages: TicketMessage[];
};

type CannedResponse = {
  id: string;
  title: string;
  shortcut: string;
  category: string;
  body: string;
};

export function InboxClient() {
  const searchParams = useSearchParams();
  const initialTicketParam = searchParams.get("ticket");
  const { pushToast } = useToast();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [cannedList, setCannedList] = useState<CannedResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialTicketParam);
  const [detail, setDetail] = useState<TicketDetailPayload | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [composerBody, setComposerBody] = useState("");
  const [composerMode, setComposerMode] = useState<"public" | "internal">("public");
  const [cannedOpen, setCannedOpen] = useState(false);
  const [aiDraftMeta, setAiDraftMeta] = useState<AiDraftResult | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingMeta, setUpdatingMeta] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("auto");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAgent, setNewAgent] = useState<string>(SUPPORT_AGENTS[0]);
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (statusFilter !== "all") qs.set("status", statusFilter);
    if (priorityFilter !== "all") qs.set("priority", priorityFilter);
    if (categoryFilter !== "all") qs.set("category", categoryFilter);
    const res = await fetch(`/api/tickets?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { tickets: TicketListItem[] };
    setTickets(data.tickets);
    setSelectedId((prev) => {
      if (prev && data.tickets.some((t) => t.id === prev)) return prev;
      return data.tickets[0]?.id ?? null;
    });
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const fetchAux = useCallback(async () => {
    const [custRes, cannedRes] = await Promise.all([
      fetch("/api/customers", { cache: "no-store" }),
      fetch("/api/canned-responses", { cache: "no-store" }),
    ]);
    if (custRes.ok) {
      const json = (await custRes.json()) as { customers: CustomerSummary[] };
      setCustomers(json.customers);
      setNewCustomerId((prev) => prev || json.customers[0]?.id || "");
    }
    if (cannedRes.ok) {
      const json = (await cannedRes.json()) as { cannedResponses: CannedResponse[] };
      setCannedList(json.cannedResponses);
    }
  }, []);

  const fetchTicketDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as TicketDetailPayload;
    setDetail(data);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAux();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAux]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      void fetchTicketDetail(selectedId);
      setAiDraftMeta(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedId, fetchTicketDetail]);

  const handleMetaUpdate = async (patch: Record<string, string | null>) => {
    if (!selectedId) return;
    setUpdatingMeta(true);
    try {
      const res = await fetch(`/api/tickets/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast(json.error || "Failed to update ticket.", "error");
        return;
      }
      pushToast("Ticket updated.", "success");
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedId)]);
    } finally {
      setUpdatingMeta(false);
    }
  };

  const handleGenerateAiDraft = async () => {
    if (!selectedId) return;
    setGeneratingDraft(true);
    try {
      const res = await fetch(`/api/tickets/${selectedId}/ai-draft`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as AiDraftResult & { error?: string };
      if (!res.ok) {
        pushToast(data.error || "Unable to generate AI draft.", "error");
        return;
      }
      // Strictly populate the editable textarea ONLY — never auto-send!
      setComposerMode("public");
      setComposerBody(data.draft);
      setAiDraftMeta(data);
      pushToast("AI draft inserted into composer. Review & edit before sending.", "info");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleInsertCanned = (item: CannedResponse) => {
    setComposerBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${item.body}` : item.body));
    setCannedOpen(false);
    pushToast(`Inserted macro ${item.shortcut}`, "info");
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !composerBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: composerBody.trim(),
          isInternalNote: composerMode === "internal",
          authorRole: "agent",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast(data.error || "Failed to post message.", "error");
        return;
      }
      setComposerBody("");
      setAiDraftMeta(null);
      pushToast(
        composerMode === "internal"
          ? "Internal agent note saved (hidden from customer)."
          : "Public reply sent to customer.",
        "success",
      );
      await Promise.all([fetchTickets(), fetchTicketDetail(selectedId)]);
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newCustomerId,
          subject: newSubject,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          assignedAgentName: newAgent || null,
          source: "agent",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ticket?: { id: string; ticketNumber: string };
        error?: string;
      };
      if (!res.ok) {
        pushToast(data.error || "Failed to create ticket.", "error");
        return;
      }
      pushToast(`Created ticket ${data.ticket?.ticketNumber || ""}`, "success");
      setCreateOpen(false);
      setNewSubject("");
      setNewDescription("");
      setNewCategory("auto");
      setNewPriority("medium");
      await fetchTickets();
      if (data.ticket?.id) {
        setSelectedId(data.ticket.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const activeTicket = detail?.ticket ?? null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Shared Inbox &amp; Ticket Workspace
          </h1>
          <p className="text-xs text-slate-500">
            {tickets.length} matching ticket{tickets.length === 1 ? "" : "s"} · Public replies update
            First Response SLA; internal notes stay private.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket #, subject, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:bg-white"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:bg-white"
        >
          <option value="all">All Statuses</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:bg-white"
        >
          <option value="all">All Priorities</option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:bg-white"
        >
          <option value="all">All Categories</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Split-Pane Inbox */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Queue */}
        <section className="inbox-scroll flex max-h-[760px] flex-col gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:col-span-5 xl:col-span-4">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-slate-500">
              No tickets match the selected filters.
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    isSelected
                      ? "border-[#2563eb] bg-blue-50/60 ring-1 ring-[#2563eb]/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-mono text-xs font-bold text-[#2563eb]">
                      {t.ticketNumber}
                    </span>
                    <SlaBadge state={t.sla.state} label={t.sla.label} />
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-900">
                    {t.subject}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate">
                      {t.customer.name} · {t.customer.company}
                    </span>
                    <span className="shrink-0 pl-2">
                      {t.messageCount} msg{t.messageCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    <CategoryBadge category={t.category} />
                  </div>
                </button>
              );
            })
          )}
        </section>

        {/* Right Conversation & Controls Pane */}
        <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs lg:col-span-7 xl:col-span-8">
          {!activeTicket ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-slate-500">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium">Select a ticket from the queue to inspect.</p>
            </div>
          ) : (
            <>
              {/* Ticket Header + Controls */}
              <div className="space-y-3 border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2563eb]">
                        {activeTicket.ticketNumber}
                      </span>
                      <PlanBadge planTier={activeTicket.customer.planTier} />
                      <SlaBadge state={activeTicket.sla.state} label={activeTicket.sla.label} />
                    </div>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-900">
                      {activeTicket.subject}
                    </h2>
                    <div className="mt-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {activeTicket.customer.name}
                      </span>{" "}
                      ({activeTicket.customer.email}) · {activeTicket.customer.company}
                    </div>
                  </div>

                  {/* Quick Resolve / Reopen Action */}
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTicket.status !== "resolved" && activeTicket.status !== "closed" ? (
                      <button
                        type="button"
                        disabled={updatingMeta}
                        onClick={() => void handleMetaUpdate({ status: "resolved" })}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingMeta}
                        onClick={() => void handleMetaUpdate({ status: "open" })}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Triage Controls */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">Status</label>
                    <select
                      aria-label="Ticket status"
                      value={activeTicket.status}
                      disabled={updatingMeta}
                      onChange={(e) => void handleMetaUpdate({ status: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Priority
                    </label>
                    <select
                      aria-label="Ticket priority"
                      value={activeTicket.priority}
                      disabled={updatingMeta}
                      onChange={(e) => void handleMetaUpdate({ priority: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Category
                    </label>
                    <select
                      aria-label="Ticket category"
                      value={activeTicket.category}
                      disabled={updatingMeta}
                      onChange={(e) => void handleMetaUpdate({ category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <UserCheck className="h-3 w-3" />
                      Assigned Agent
                    </label>
                    <select
                      aria-label="Assigned agent"
                      value={activeTicket.assignedAgentName ?? ""}
                      disabled={updatingMeta}
                      onChange={(e) =>
                        void handleMetaUpdate({
                          assignedAgentName: e.target.value ? e.target.value : null,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="">Unassigned</option>
                      {SUPPORT_AGENTS.map((agent) => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Conversation History */}
              <div className="inbox-scroll max-h-[380px] flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] p-5">
                {(detail?.messages ?? []).map((msg) => {
                  const isNote = msg.isInternalNote;
                  const isAgent = msg.authorRole === "agent";
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-2xl border p-4 text-sm ${
                        isNote
                          ? "border-amber-300 bg-amber-50/90 text-amber-950"
                          : isAgent
                            ? "ml-4 border-blue-200 bg-blue-50/70 text-slate-900 sm:ml-8"
                            : "mr-4 border-slate-200 bg-white text-slate-900 sm:mr-8"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 font-semibold">
                          <span>{msg.authorName}</span>
                          {isNote ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                              <Lock className="h-3 w-3" />
                              Internal Agent Note
                            </span>
                          ) : isAgent ? (
                            <span className="rounded-full bg-[#2563eb] px-2 py-0.5 text-[11px] font-semibold text-white">
                              Public Reply
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              Customer
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(msg.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply & Internal Note Composer */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                  {/* Public Reply vs Internal Note Toggle */}
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setComposerMode("public")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        composerMode === "public"
                          ? "bg-[#2563eb] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Public Customer Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode("internal")}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
                        composerMode === "internal"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </button>
                  </div>

                  {/* Canned Responses + AI Draft Suggestion */}
                  <div className="relative flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCannedOpen((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Insert Canned Response
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleGenerateAiDraft()}
                      disabled={generatingDraft}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
                      {generatingDraft ? "Drafting…" : "Generate AI Draft Suggestion"}
                    </button>

                    {cannedOpen ? (
                      <div className="absolute right-0 bottom-10 z-30 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-700">
                          <span>Canned Macros</span>
                          <button
                            type="button"
                            onClick={() => setCannedOpen(false)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="max-h-56 space-y-1 overflow-y-auto pt-1">
                          {cannedList.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleInsertCanned(item)}
                              className="w-full rounded-xl p-2 text-left transition hover:bg-blue-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-semibold text-slate-900">
                                  {item.title}
                                </span>
                                <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                                  {item.shortcut}
                                </code>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                                {item.body}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* AI Draft Grounding Banner */}
                {aiDraftMeta ? (
                  <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2.5 text-xs text-indigo-950">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        AI Draft Ready — Review &amp; edit before sending (never auto-sent)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiDraftMeta(null)}
                        className="text-indigo-500 hover:text-indigo-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 text-indigo-800">{aiDraftMeta.reasoning}</div>
                    {aiDraftMeta.matchedArticles.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-[#2563eb]" />
                        {aiDraftMeta.matchedArticles.map((art) => (
                          <span
                            key={art.id}
                            className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-900 ring-1 ring-indigo-200"
                          >
                            {art.title}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <textarea
                  rows={4}
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  placeholder={
                    composerMode === "internal"
                      ? "Write an internal note visible only to SupportOS agents…"
                      : "Write a public reply to the customer…"
                  }
                  className={`w-full rounded-xl border p-3 text-sm outline-none transition ${
                    composerMode === "internal"
                      ? "border-amber-300 bg-amber-50/40 text-amber-950 focus:border-amber-500"
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#2563eb] focus:bg-white"
                  }`}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {composerMode === "internal"
                      ? "Private internal note — will NOT email customer or alter First Response SLA."
                      : "Public reply — visible in Customer Portal and records First Response SLA."}
                  </span>
                  <button
                    type="submit"
                    disabled={sending || !composerBody.trim()}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 ${
                      composerMode === "internal"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-[#2563eb] hover:bg-[#1d4ed8]"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending
                      ? "Posting…"
                      : composerMode === "internal"
                        ? "Save Internal Note"
                        : "Send Public Reply"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      {/* Create Ticket Modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create Support Ticket</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Customer</label>
                <select
                  required
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.company} ({c.planTier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Short summary of the customer issue"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-900"
                  >
                    <option value="auto">Auto-Detect</option>
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-900"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Assign To</label>
                  <select
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {SUPPORT_AGENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  required
                  minLength={10}
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Include reproduction steps, invoice IDs, or affected region…"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
