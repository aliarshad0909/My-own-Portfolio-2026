"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRightCircle, CheckCircle2, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { LEAD_SOURCES, LEAD_STATUSES, formatShortDate, formatUsd } from "@/lib/constants";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  source: string;
  status: string;
  score: number;
  estimatedValue: number;
  ownerId: string | null;
  ownerName: string;
  followUpAt: string | null;
  notes: string;
  convertedDealId: string | null;
};

type TeamMember = { id: string; name: string };

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  source: "website",
  status: "new",
  score: 65,
  estimatedValue: 15000,
  ownerId: "",
  followUpAt: "",
  notes: "",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200",
  contacted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unqualified: "bg-slate-100 text-slate-600 border-slate-200",
  converted: "bg-blue-600 text-white border-blue-600",
};

export function LeadsClient() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [convertTarget, setConvertTarget] = useState<LeadRow | null>(null);
  const [convertTitle, setConvertTitle] = useState("");
  const [convertValue, setConvertValue] = useState(0);
  const [converting, setConverting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`/api/leads?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLeads(json.leads || []);
      setTeam(json.team || []);
    } catch {
      toast("Unable to load leads.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, sourceFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, ownerId: team[0]?.id ?? "" });
    setModalOpen(true);
  }

  function openEdit(l: LeadRow) {
    setEditingId(l.id);
    setForm({
      name: l.name,
      email: l.email,
      phone: l.phone,
      companyName: l.companyName,
      source: l.source,
      status: l.status,
      score: l.score,
      estimatedValue: l.estimatedValue,
      ownerId: l.ownerId ?? "",
      followUpAt: l.followUpAt ? l.followUpAt.slice(0, 10) : "",
      notes: l.notes,
    });
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/leads/${editingId}` : "/api/leads";
      const method = editingId ? "PATCH" : "POST";
      const payload = {
        ...form,
        ownerId: form.ownerId || null,
        followUpAt: form.followUpAt ? new Date(`${form.followUpAt}T12:00:00Z`).toISOString() : null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to save lead.", "error");
        return;
      }
      setModalOpen(false);
      toast(editingId ? "Lead updated." : "Lead created.", "success");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function quickQualify(l: LeadRow) {
    const res = await fetch(`/api/leads/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "qualified", score: Math.max(l.score, 80) }),
    });
    if (res.ok) {
      toast(`${l.name} marked Qualified.`, "success");
      void load();
    } else {
      toast("Unable to qualify lead.", "error");
    }
  }

  function openConvert(l: LeadRow) {
    setConvertTarget(l);
    setConvertTitle(`${l.companyName || l.name} Opportunity`);
    setConvertValue(l.estimatedValue || 15000);
  }

  async function handleConvert(e: FormEvent) {
    e.preventDefault();
    if (!convertTarget) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${convertTarget.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealTitle: convertTitle.trim(),
          value: convertValue,
          stage: "qualified",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to convert lead.", "error");
        return;
      }
      setConvertTarget(null);
      toast(`Converted into active deal "${data.deal?.title}" & contact created.`, "success");
      void load();
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Unable to delete lead.", "error");
        return;
      }
      setDeleteTarget(null);
      toast("Lead deleted.", "info");
      void load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Score inbound inquiries, qualify prospects, schedule follow-ups and convert into active sales opportunities.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search leads by name, company, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No leads match your current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Est. Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">
                        {l.companyName ? `${l.companyName} · ` : ""}
                        {l.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium capitalize text-slate-600">{l.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              l.score >= 75 ? "bg-emerald-500" : l.score >= 50 ? "bg-blue-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(l.score, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{l.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatUsd(l.estimatedValue)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLE[l.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatShortDate(l.followUpAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status !== "qualified" && l.status !== "converted" ? (
                          <button
                            type="button"
                            onClick={() => void quickQualify(l)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Qualify</span>
                          </button>
                        ) : null}

                        {l.status !== "converted" ? (
                          <button
                            type="button"
                            onClick={() => openConvert(l)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                            <span>Convert</span>
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => openEdit(l)}
                          aria-label={`Edit ${l.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(l)}
                          aria-label={`Delete ${l.name}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Lead Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Lead" : "New Lead"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Lead name *</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Email *</span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Company</span>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Phone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Source</span>
                  <select
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Score (0–100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.score}
                    onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Est. value (USD)</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={form.estimatedValue}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedValue: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Owner</span>
                  <select
                    value={form.ownerId}
                    onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Follow-up date</span>
                  <input
                    type="date"
                    value={form.followUpAt}
                    onChange={(e) => setForm((f) => ({ ...f, followUpAt: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Convert Lead to Opportunity Modal */}
      {convertTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Convert Lead to Opportunity</h2>
            <p className="mt-1 text-xs text-slate-600">
              Creates a Contact record, adds an active Deal in the Sales Pipeline, and schedules an automatic follow-up task.
            </p>
            <form onSubmit={handleConvert} className="mt-4 space-y-3.5 text-sm">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Opportunity title *</span>
                <input
                  required
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Deal value (USD)</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={convertValue}
                  onChange={(e) => setConvertValue(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertTarget(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {converting ? "Converting…" : "Convert to Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete lead?"
        description={deleteTarget ? `Permanently delete lead "${deleteTarget.name}"?` : ""}
        confirmLabel="Delete Lead"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
