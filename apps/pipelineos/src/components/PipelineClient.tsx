"use client";

import { useCallback, useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Building2, Calendar, Clock, Edit3, History, Plus, Trash2, User, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { DEAL_STAGES, formatShortDate, formatUsd, stageLabel, type DealStage } from "@/lib/constants";

type DealRow = {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  contactId: string | null;
  contactName: string | null;
  companyName: string;
  ownerId: string | null;
  ownerName: string;
  ownerColor: string;
  notes: string;
  updatedAt: string;
};

type TeamMember = { id: string; name: string };
type ContactOption = { id: string; firstName: string; lastName: string; companyName: string };
type HistoryEntry = {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  note: string;
  createdAt: string;
};

const EMPTY_FORM = {
  title: "",
  value: 20000,
  stage: "new_lead" as DealStage,
  expectedCloseDate: "",
  companyName: "",
  contactId: "",
  ownerId: "",
  notes: "",
};

export function PipelineClient() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [historyDeal, setHistoryDeal] = useState<DealRow | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<DealRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/deals", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDeals(json.deals || []);
      setTeam(json.team || []);
      setContacts(json.contacts || []);
    } catch {
      toast("Unable to load sales pipeline.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  async function moveStage(deal: DealRow, nextStage: DealStage) {
    if (deal.stage === nextStage) return;
    // Optimistic UI update
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage } : d)));
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: nextStage,
        stageNote: `Moved via Kanban board from ${stageLabel(deal.stage)} to ${stageLabel(nextStage)}`,
      }),
    });
    if (!res.ok) {
      toast("Unable to move deal stage.", "error");
      void load();
      return;
    }
    toast(`Moved "${deal.title}" to ${stageLabel(nextStage)}.`, "success");
    void load();
  }

  function handleDragStart(e: DragEvent, dealId: string) {
    setDraggingId(dealId);
    e.dataTransfer.setData("text/plain", dealId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: DragEvent, targetStage: DealStage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    const deal = deals.find((d) => d.id === id);
    if (deal) void moveStage(deal, targetStage);
  }

  function openCreate(defaultStage: DealStage = "new_lead") {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      stage: defaultStage,
      ownerId: team[0]?.id ?? "",
      expectedCloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(d: DealRow) {
    setEditingId(d.id);
    setForm({
      title: d.title,
      value: d.value,
      stage: d.stage,
      expectedCloseDate: d.expectedCloseDate,
      companyName: d.companyName,
      contactId: d.contactId ?? "",
      ownerId: d.ownerId ?? "",
      notes: d.notes,
    });
    setModalOpen(true);
  }

  async function openHistory(d: DealRow) {
    setHistoryDeal(d);
    const res = await fetch(`/api/deals/${d.id}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setHistoryItems(json.history || []);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/deals/${editingId}` : "/api/deals";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contactId: form.contactId || null,
          ownerId: form.ownerId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to save deal.", "error");
        return;
      }
      setModalOpen(false);
      toast(editingId ? "Deal updated." : "Deal added to pipeline.", "success");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/deals/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Unable to delete deal.", "error");
        return;
      }
      setDeleteTarget(null);
      toast("Deal removed.", "info");
      void load();
    } finally {
      setDeleting(false);
    }
  }

  const activeTotal = deals.filter((d) => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value, 0);
  const wonTotal = deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Drag cards across stages or use the stage selector on each card. Active pipeline:{" "}
            <strong className="text-slate-900">{formatUsd(activeTotal)}</strong> · Closed won:{" "}
            <strong className="text-emerald-700">{formatUsd(wonTotal)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate("new_lead")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Deal</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading pipeline stages…
        </div>
      ) : (
        <div className="pipeline-scroll flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.id);
            const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);
            const isOver = dragOverStage === stage.id;

            return (
              <section
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.id);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition ${
                  isOver ? "border-blue-500 bg-blue-50/70" : "border-slate-200 bg-slate-100/75"
                }`}
                aria-label={`${stage.label} stage`}
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">{stage.label}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs">
                      {stageDeals.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate(stage.id)}
                    aria-label={`Add deal to ${stage.label}`}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mb-3 px-1 text-xs font-semibold text-slate-600">{formatUsd(stageSum)}</p>

                <div className="flex flex-1 flex-col gap-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                      Drop deal here
                    </div>
                  ) : (
                    stageDeals.map((d) => (
                      <article
                        key={d.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, d.id)}
                        className="cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-blue-300 hover:shadow-sm active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug text-slate-900">{d.title}</h3>
                          <span className="shrink-0 text-xs font-bold text-blue-700">{formatUsd(d.value)}</span>
                        </div>

                        {d.companyName ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{d.companyName}</span>
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" /> {d.ownerName}
                          </span>
                          {d.expectedCloseDate ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {d.expectedCloseDate}
                            </span>
                          ) : null}
                        </div>

                        {d.notes ? <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">{d.notes}</p> : null}

                        <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5">
                          <select
                            aria-label={`Change stage for ${d.title}`}
                            value={d.stage}
                            onChange={(e) => void moveStage(d, e.target.value as DealStage)}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-medium text-slate-700"
                          >
                            {DEAL_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void openHistory(d)}
                              aria-label={`View history for ${d.title}`}
                              title="Deal stage history"
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(d)}
                              aria-label={`Edit ${d.title}`}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(d)}
                              aria-label={`Delete ${d.title}`}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Create / Edit Deal Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Deal" : "New Deal"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-sm">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Deal title *</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Deal value (USD)</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Pipeline stage</span>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as DealStage }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Company name</span>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Expected close date</span>
                  <input
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Primary contact</span>
                  <select
                    value={form.contactId}
                    onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Deal owner</span>
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
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={3}
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
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Deal Stage History Drawer */}
      {historyDeal ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" role="dialog" aria-modal="true">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{historyDeal.title}</h2>
                <p className="text-xs text-slate-500">
                  {formatUsd(historyDeal.value)} · Current stage: {stageLabel(historyDeal.stage)}
                </p>
              </div>
              <button type="button" onClick={() => setHistoryDeal(null)} className="rounded p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Stage Audit History</h3>
              {historyItems.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No stage transitions recorded yet.</p>
              ) : (
                <ol className="mt-4 space-y-3 border-l-2 border-blue-200 pl-4">
                  {historyItems.map((h) => (
                    <li key={h.id} className="text-xs">
                      <p className="font-semibold text-slate-900">
                        {h.fromStage ? `${stageLabel(h.fromStage)} → ` : "Created in "}
                        {stageLabel(h.toStage)}
                      </p>
                      {h.note ? <p className="mt-0.5 text-slate-600">{h.note}</p> : null}
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" /> {h.changedBy} · {formatShortDate(h.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete deal?"
        description={deleteTarget ? `Remove "${deleteTarget.title}" from the pipeline?` : ""}
        confirmLabel="Delete Deal"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
