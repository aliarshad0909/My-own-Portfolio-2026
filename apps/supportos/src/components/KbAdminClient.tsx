"use client";

import {
  BookOpen,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CategoryBadge, PriorityBadge } from "@/components/Badges";
import { useToast } from "@/components/ToastProvider";
import {
  CATEGORY_LABELS,
  SLA_POLICY_HOURS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/constants";
import type { SupportAnalytics } from "@/lib/support-engine";
import { formatDurationMinutes } from "@/lib/support-engine";

type KbArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  views: number;
  published: boolean;
  updatedAt: string;
};

export function KbAdminClient() {
  const { pushToast } = useToast();

  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewArticle, setPreviewArticle] = useState<KbArticle | null>(null);

  const [modal, setModal] = useState<{ open: boolean; editing: KbArticle | null }>({
    open: false,
    editing: null,
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("technical");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (categoryFilter !== "all") qs.set("category", categoryFilter);

    const [kbRes, dashRes] = await Promise.all([
      fetch(`/api/kb?${qs.toString()}`, { cache: "no-store" }),
      fetch("/api/dashboard", { cache: "no-store" }),
    ]);

    if (kbRes.ok) {
      const json = (await kbRes.json()) as { articles: KbArticle[] };
      setArticles(json.articles);
    }
    if (dashRes.ok) {
      const json = (await dashRes.json()) as { analytics: SupportAnalytics };
      setAnalytics(json.analytics);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(t);
  }, [loadData]);

  const openForm = (article: KbArticle | null) => {
    setModal({ open: true, editing: article });
    setTitle(article?.title ?? "");
    setCategory(article?.category ?? "technical");
    setSummary(article?.summary ?? "");
    setBody(article?.body ?? "");
    setPublished(article ? article.published : true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = modal.editing ? `/api/kb/${modal.editing.id}` : "/api/kb";
      const method = modal.editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, summary, body, published }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast(json.error || "Unable to save article.", "error");
        return;
      }
      pushToast(modal.editing ? "Article updated." : "KB article created.", "success");
      setModal({ open: false, editing: null });
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article: KbArticle) => {
    const res = await fetch(`/api/kb/${article.id}`, { method: "DELETE" });
    if (!res.ok) {
      pushToast("Unable to delete article.", "error");
      return;
    }
    pushToast(`Deleted "${article.title}"`, "info");
    await loadData();
  };

  const handleTogglePublished = async (article: KbArticle) => {
    const res = await fetch(`/api/kb/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !article.published }),
    });
    if (!res.ok) return;
    pushToast(article.published ? "Moved article to Draft." : "Article published.", "info");
    await loadData();
  };

  const handlePreview = async (article: KbArticle) => {
    setPreviewArticle(article);
    await fetch(`/api/kb/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incrementViews: true }),
    });
    await loadData();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Base &amp; Admin SLA Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Curate Help Center articles that ground AI reply drafts and monitor workspace SLA
            thresholds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          New KB Article
        </button>
      </div>

      {/* Knowledge Base Library */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-lg font-bold text-slate-900">
              Knowledge Base Articles ({articles.length})
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <select
              aria-label="Filter KB by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">All Categories</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((art) => (
            <div
              key={art.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={art.category} />
                    <button
                      type="button"
                      onClick={() => void handleTogglePublished(art)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        art.published
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {art.published ? "Published" : "Draft"}
                    </button>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Eye className="h-3.5 w-3.5" />
                    {art.views}
                  </span>
                </div>

                <h3 className="mt-2.5 text-base font-bold text-slate-900">{art.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{art.summary}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
                <button
                  type="button"
                  onClick={() => void handlePreview(art)}
                  className="text-xs font-semibold text-[#2563eb] hover:underline"
                >
                  Read Full Guide →
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openForm(art)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                    aria-label={`Edit ${art.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(art)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${art.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admin SLA Policy Thresholds */}
      <section
        id="sla"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-[#2563eb]" />
              Admin SLA Policy Thresholds
            </h2>
            <p className="text-xs text-slate-500">
              Active workspace response targets applied automatically upon ticket submission
            </p>
          </div>
          {analytics ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#1e1b4b]">
              Overall SLA Compliance: {analytics.kpis.slaCompliancePct}%
            </span>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4">Priority Tier</th>
                <th className="px-3 py-2.5">First Response SLA</th>
                <th className="px-3 py-2.5">Resolution Target</th>
                <th className="px-3 py-2.5">Current Tickets</th>
                <th className="px-3 py-2.5">Breached / At-Risk</th>
                <th className="pl-3 py-2.5">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TICKET_PRIORITIES.slice()
                .reverse()
                .map((priority) => {
                  const policy = SLA_POLICY_HOURS[priority];
                  const metric = analytics?.byPriority.find((p) => p.priority === priority);
                  return (
                    <tr key={priority} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4">
                        <PriorityBadge priority={priority} />
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        {policy.firstResponseHours}h
                      </td>
                      <td className="px-3 py-3 text-slate-700">{policy.resolutionHours}h</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {metric?.count ?? 0}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="font-semibold text-rose-700">
                          {metric?.breached ?? 0} breached
                        </span>{" "}
                        ·{" "}
                        <span className="font-semibold text-amber-700">
                          {metric?.atRisk ?? 0} at risk
                        </span>
                      </td>
                      <td className="pl-3 py-3 text-xs text-slate-600">{policy.description}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Agent Performance Breakdown */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Users className="h-5 w-5 text-[#2563eb]" />
          Agent SLA &amp; Throughput Breakdown
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4">Agent</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">Open</th>
                <th className="px-3 py-2.5">Resolved</th>
                <th className="px-3 py-2.5">Avg First Response</th>
                <th className="pl-3 py-2.5 text-right">SLA Attainment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics?.agentPerformance ?? []).map((ag) => (
                <tr key={ag.agentName} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{ag.agentName}</td>
                  <td className="px-3 py-3">{ag.assignedCount}</td>
                  <td className="px-3 py-3">{ag.openCount}</td>
                  <td className="px-3 py-3 font-medium text-emerald-700">{ag.resolvedCount}</td>
                  <td className="px-3 py-3">
                    {ag.avgFirstResponseMinutes !== null
                      ? formatDurationMinutes(ag.avgFirstResponseMinutes)
                      : "Pending"}
                  </td>
                  <td className="pl-3 py-3 text-right font-bold text-[#1e1b4b]">
                    {ag.slaCompliancePct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Article Preview Modal */}
      {previewArticle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CategoryBadge category={previewArticle.category} />
                <h2 className="mt-2 text-xl font-bold text-slate-900">{previewArticle.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Slug: <code>/{previewArticle.slug}</code> · {previewArticle.views} views
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
              {previewArticle.summary}
            </p>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {previewArticle.body}
            </div>
          </div>
        </div>
      ) : null}

      {/* Create / Edit KB Modal */}
      {modal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modal.editing ? "Edit KB Article" : "New KB Article"}
              </h2>
              <button
                type="button"
                onClick={() => setModal({ open: false, editing: null })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#2563eb]"
                    />
                    Published in Customer Portal &amp; AI Drafts
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Summary</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Article Body</label>
                <textarea
                  rows={6}
                  required
                  minLength={20}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, editing: null })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  {saving ? "Saving…" : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
