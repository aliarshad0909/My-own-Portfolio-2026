"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Circle, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { ACTIVITY_TYPES, formatShortDate } from "@/lib/constants";

type ActivityRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  contactName: string | null;
  dealTitle: string | null;
  leadName: string | null;
  ownerName: string;
  createdAt: string;
};

type OptionItem = { id: string; label: string };

const EMPTY_FORM = {
  type: "call",
  title: "",
  description: "",
  status: "pending",
  dueAt: "",
  contactId: "",
  dealId: "",
};

export function ActivitiesClient() {
  const { toast } = useToast();
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [contacts, setContacts] = useState<OptionItem[]>([]);
  const [deals, setDeals] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/activities?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json.activities || []);
      setContacts(
        (json.contacts || []).map((c: { id: string; firstName: string; lastName: string }) => ({
          id: c.id,
          label: `${c.firstName} ${c.lastName}`,
        })),
      );
      setDeals((json.deals || []).map((d: { id: string; title: string }) => ({ id: d.id, label: d.title })));
    } catch {
      toast("Unable to load activities.", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  async function toggleStatus(act: ActivityRow) {
    const next = act.status === "completed" ? "pending" : "completed";
    const res = await fetch(`/api/activities/${act.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast(next === "completed" ? "Task completed." : "Task reopened.", "success");
      void load();
    } else {
      toast("Unable to update task status.", "error");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueAt: form.dueAt ? new Date(`${form.dueAt}T12:00:00Z`).toISOString() : null,
          contactId: form.contactId || null,
          dealId: form.dealId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to create activity.", "error");
        return;
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      toast("Activity saved.", "success");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Unable to delete activity.", "error");
        return;
      }
      setDeleteTarget(null);
      toast("Activity removed.", "info");
      void load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activities &amp; Tasks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track calls, meetings, emails, follow-ups and reminders linked to your contacts and deals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ ...EMPTY_FORM, dueAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Task / Activity</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex gap-1.5">
          {["all", "pending", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === st ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          aria-label="Filter by activity type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          <option value="all">All types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading activities…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No activities match the current filter.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((act) => (
              <li key={act.id} className="flex flex-wrap items-start justify-between gap-3 p-4 hover:bg-slate-50/70">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void toggleStatus(act)}
                    aria-label={act.status === "completed" ? `Reopen ${act.title}` : `Complete ${act.title}`}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600"
                  >
                    {act.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        act.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {act.title}
                    </p>
                    {act.description ? <p className="mt-0.5 text-xs text-slate-600">{act.description}</p> : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold uppercase text-slate-600">
                        {act.type.replace("_", " ")}
                      </span>
                      <span>Owner: {act.ownerName}</span>
                      {act.contactName ? <span>· Contact: {act.contactName}</span> : null}
                      {act.dealTitle ? <span>· Deal: {act.dealTitle}</span> : null}
                      {act.dueAt ? <span>· Due: {formatShortDate(act.dueAt)}</span> : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(act)}
                  aria-label={`Delete ${act.title}`}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Log Activity / Create Task</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Type</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Due date</span>
                  <input
                    type="date"
                    value={form.dueAt}
                    onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Title *</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Follow-up call on proposal pricing"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Linked contact</span>
                  <select
                    value={form.contactId}
                    onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Linked deal</span>
                  <select
                    value={form.dealId}
                    onChange={(e) => setForm((f) => ({ ...f, dealId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    <option value="">None</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                  {saving ? "Saving…" : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete activity?"
        description={deleteTarget ? `Remove "${deleteTarget.title}" from activity history?` : ""}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
