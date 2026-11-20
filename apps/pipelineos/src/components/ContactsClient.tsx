"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, Edit3, Mail, MessageSquarePlus, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { CONTACT_CATEGORIES, CONTACT_STATUSES, formatShortDate } from "@/lib/constants";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyName: string;
  status: string;
  category: string;
  ownerId: string | null;
  ownerName: string;
  notes: string;
  createdAt: string;
};

type TeamMember = { id: string; name: string; avatarColor: string };

type ContactActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  companyName: "",
  status: "active",
  category: "decision_maker",
  notes: "",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  prospect: "bg-amber-50 text-amber-700 border-amber-200",
  customer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

export function ContactsClient() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ContactRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail & communication history drawer
  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [history, setHistory] = useState<ContactActivity[]>([]);
  const [commType, setCommType] = useState<"call" | "email" | "meeting" | "note">("call");
  const [commTitle, setCommTitle] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [loggingComm, setLoggingComm] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/contacts?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load contacts");
      const json = await res.json();
      setContacts(json.contacts || []);
      setTeam(json.team || []);
    } catch {
      toast("Unable to load contacts.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, categoryFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  async function openDetail(c: ContactRow) {
    setSelected(c);
    const res = await fetch(`/api/contacts/${c.id}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setHistory(json.activities || []);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: ContactRow) {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      title: c.title,
      companyName: c.companyName,
      status: c.status,
      category: c.category,
      notes: c.notes,
    });
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to save contact.", "error");
        return;
      }
      setModalOpen(false);
      toast(editingId ? "Contact updated." : "Contact created.", "success");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Unable to delete contact.", "error");
        return;
      }
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      toast("Contact deleted.", "info");
      void load();
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogComm(e: FormEvent) {
    e.preventDefault();
    if (!selected || !commTitle.trim()) return;
    setLoggingComm(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: commType,
          title: commTitle.trim(),
          description: commDesc.trim(),
          status: "completed",
          contactId: selected.id,
        }),
      });
      if (!res.ok) {
        toast("Unable to log communication.", "error");
        return;
      }
      setCommTitle("");
      setCommDesc("");
      toast("Communication logged to contact history.", "success");
      void openDetail(selected);
    } finally {
      setLoggingComm(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search, filter, edit notes and record full communication history for every business contact.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search name, email, company, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">All categories</option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Contacts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading contacts from PostgreSQL…</div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">No contacts match your filters</p>
            <p className="mt-1 text-xs text-slate-500">Clear your search criteria or add a new contact.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Company &amp; Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void openDetail(c)}
                        className="text-left font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {c.firstName} {c.lastName}
                      </button>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.companyName || "—"}</span>
                      </div>
                      <p className="text-xs text-slate-500">{c.title || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_BADGE[c.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                      {c.category.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.ownerName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openDetail(c)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          History
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.firstName} ${c.lastName}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`Delete ${c.firstName} ${c.lastName}`}
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

      {/* Create / Edit Contact Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Contact" : "New Contact"}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">First name *</span>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Last name *</span>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Phone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
                  <span className="text-xs font-semibold text-slate-700">Job title</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {CONTACT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {CONTACT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
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
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Contact Detail & Communication History Drawer */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" role="dialog" aria-modal="true">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selected.firstName} {selected.lastName}
                </h2>
                <p className="text-xs text-slate-500">
                  {selected.title ? `${selected.title} · ` : ""}
                  {selected.companyName || "Independent"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                <p>
                  <strong className="text-slate-700">Email:</strong> {selected.email}
                </p>
                <p>
                  <strong className="text-slate-700">Phone:</strong> {selected.phone || "—"}
                </p>
                <p>
                  <strong className="text-slate-700">Owner:</strong> {selected.ownerName}
                </p>
                <p>
                  <strong className="text-slate-700">Notes:</strong> {selected.notes || "No notes recorded yet."}
                </p>
              </div>

              <form onSubmit={handleLogComm} className="space-y-2.5 rounded-lg border border-slate-200 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
                  <MessageSquarePlus className="h-3.5 w-3.5 text-blue-600" />
                  <span>Log Communication</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={commType}
                    onChange={(e) => setCommType(e.target.value as "call" | "email" | "meeting" | "note")}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Note</option>
                  </select>
                  <input
                    required
                    placeholder="Summary title…"
                    value={commTitle}
                    onChange={(e) => setCommTitle(e.target.value)}
                    className="col-span-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Key takeaways or next step…"
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={loggingComm}
                  className="w-full rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loggingComm ? "Recording…" : "Record Communication"}
                </button>
              </form>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Communication History</h3>
                {history.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">No communication entries recorded yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {history.map((h) => (
                      <li key={h.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{h.title}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {h.type}
                          </span>
                        </div>
                        {h.description ? <p className="mt-1 text-slate-600">{h.description}</p> : null}
                        <p className="mt-1.5 text-[11px] text-slate-400">{formatShortDate(h.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete contact?"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.firstName} ${deleteTarget.lastName} from PipelineOS? Linked deals will remain intact.`
            : ""
        }
        confirmLabel="Delete Contact"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Keep team reference cleanly used for future owner dropdowns */}
      <span className="sr-only">{team.length} team members active</span>
    </div>
  );
}
