"use client";

import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CategoryBadge, PlanBadge } from "@/components/Badges";
import { useToast } from "@/components/ToastProvider";
import {
  CATEGORY_LABELS,
  PLAN_LABELS,
  PLAN_TIERS,
  TICKET_CATEGORIES,
} from "@/lib/constants";

type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  company: string;
  planTier: string;
  notes: string;
  openTicketCount: number;
  resolvedTicketCount: number;
  totalTicketCount: number;
};

type CannedRecord = {
  id: string;
  title: string;
  shortcut: string;
  category: string;
  body: string;
};

export function CustomersClient() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<"customers" | "canned">("customers");

  // Customers state
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [custModal, setCustModal] = useState<{ open: boolean; editing: CustomerRecord | null }>({
    open: false,
    editing: null,
  });
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cPlan, setCPlan] = useState("growth");
  const [cNotes, setCNotes] = useState("");
  const [savingCust, setSavingCust] = useState(false);

  // Canned Responses state
  const [canned, setCanned] = useState<CannedRecord[]>([]);
  const [cannedSearch, setCannedSearch] = useState("");
  const [cannedCat, setCannedCat] = useState("all");
  const [cannedModal, setCannedModal] = useState<{ open: boolean; editing: CannedRecord | null }>({
    open: false,
    editing: null,
  });
  const [mTitle, setMTitle] = useState("");
  const [mShortcut, setMShortcut] = useState("");
  const [mCategory, setMCategory] = useState("technical");
  const [mBody, setMBody] = useState("");
  const [savingMacro, setSavingMacro] = useState(false);

  const loadCustomers = useCallback(async () => {
    const qs = new URLSearchParams();
    if (custSearch.trim()) qs.set("search", custSearch.trim());
    if (planFilter !== "all") qs.set("planTier", planFilter);
    const res = await fetch(`/api/customers?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { customers: CustomerRecord[] };
    setCustomers(json.customers);
  }, [custSearch, planFilter]);

  const loadCanned = useCallback(async () => {
    const qs = new URLSearchParams();
    if (cannedSearch.trim()) qs.set("search", cannedSearch.trim());
    if (cannedCat !== "all") qs.set("category", cannedCat);
    const res = await fetch(`/api/canned-responses?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { cannedResponses: CannedRecord[] };
    setCanned(json.cannedResponses);
  }, [cannedSearch, cannedCat]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadCustomers(), 0);
    return () => window.clearTimeout(t);
  }, [loadCustomers]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadCanned(), 0);
    return () => window.clearTimeout(t);
  }, [loadCanned]);

  const openCustomerForm = (record: CustomerRecord | null) => {
    setCustModal({ open: true, editing: record });
    setCName(record?.name ?? "");
    setCEmail(record?.email ?? "");
    setCCompany(record?.company ?? "");
    setCPlan(record?.planTier ?? "growth");
    setCNotes(record?.notes ?? "");
  };

  const handleSaveCustomer = async (e: FormEvent) => {
    e.preventDefault();
    setSavingCust(true);
    try {
      const url = custModal.editing
        ? `/api/customers/${custModal.editing.id}`
        : "/api/customers";
      const method = custModal.editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName,
          email: cEmail,
          company: cCompany,
          planTier: cPlan,
          notes: cNotes,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast(json.error || "Unable to save customer.", "error");
        return;
      }
      pushToast(custModal.editing ? "Customer updated." : "Customer added.", "success");
      setCustModal({ open: false, editing: null });
      await loadCustomers();
    } finally {
      setSavingCust(false);
    }
  };

  const handleDeleteCustomer = async (record: CustomerRecord) => {
    const res = await fetch(`/api/customers/${record.id}`, { method: "DELETE" });
    if (!res.ok) {
      pushToast("Unable to remove customer.", "error");
      return;
    }
    pushToast(`Removed ${record.name}`, "info");
    await loadCustomers();
  };

  const openMacroForm = (record: CannedRecord | null) => {
    setCannedModal({ open: true, editing: record });
    setMTitle(record?.title ?? "");
    setMShortcut(record?.shortcut ?? "/");
    setMCategory(record?.category ?? "technical");
    setMBody(record?.body ?? "");
  };

  const handleSaveMacro = async (e: FormEvent) => {
    e.preventDefault();
    setSavingMacro(true);
    try {
      const url = cannedModal.editing
        ? `/api/canned-responses/${cannedModal.editing.id}`
        : "/api/canned-responses";
      const method = cannedModal.editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mTitle,
          shortcut: mShortcut,
          category: mCategory,
          body: mBody,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast(json.error || "Unable to save canned response.", "error");
        return;
      }
      pushToast(cannedModal.editing ? "Macro updated." : "Canned response created.", "success");
      setCannedModal({ open: false, editing: null });
      await loadCanned();
    } finally {
      setSavingMacro(false);
    }
  };

  const handleDeleteMacro = async (record: CannedRecord) => {
    const res = await fetch(`/api/canned-responses/${record.id}`, { method: "DELETE" });
    if (!res.ok) {
      pushToast("Unable to delete macro.", "error");
      return;
    }
    pushToast(`Deleted macro ${record.shortcut}`, "info");
    await loadCanned();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header & Switcher */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers &amp; Canned Responses
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage customer organizations with live ticket tallies and reusable agent reply macros.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "customers"
                ? "bg-[#2563eb] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("canned")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "canned"
                ? "bg-[#2563eb] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Canned Macros ({canned.length})
          </button>
        </div>
      </div>

      {/* Customer Directory Section */}
      {activeTab === "customers" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Search customers or companies…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-[#2563eb] focus:bg-white"
                />
              </div>
              <select
                aria-label="Filter by plan tier"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">All Plans</option>
                {PLAN_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {PLAN_LABELS[tier]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openCustomerForm(null)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Open Tickets</th>
                  <th className="px-3 py-3">Resolved</th>
                  <th className="px-3 py-3">Account Notes</th>
                  <th className="pl-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">{c.company}</td>
                    <td className="px-3 py-3">
                      <PlanBadge planTier={c.planTier} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563eb]">
                        {c.openTicketCount}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {c.resolvedTicketCount}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-3 py-3 text-xs text-slate-500">
                      {c.notes || "—"}
                    </td>
                    <td className="pl-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openCustomerForm(c)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCustomer(c)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Delete ${c.name}`}
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
        </section>
      ) : (
        /* Canned Responses Library Section */
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={cannedSearch}
                  onChange={(e) => setCannedSearch(e.target.value)}
                  placeholder="Search macros or /shortcuts…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-[#2563eb] focus:bg-white"
                />
              </div>
              <select
                aria-label="Filter macros by category"
                value={cannedCat}
                onChange={(e) => setCannedCat(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">All Categories</option>
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openMacroForm(null)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" />
              New Macro
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {canned.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-lg bg-[#1e1b4b] px-2 py-0.5 text-xs font-bold text-white">
                        {item.shortcut}
                      </code>
                      <CategoryBadge category={item.category} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openMacroForm(item)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteMacro(item)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Create/Edit Modal */}
      {custModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {custModal.editing ? "Edit Customer" : "Add Customer"}
              </h2>
              <button
                type="button"
                onClick={() => setCustModal({ open: false, editing: null })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Company</label>
                  <input
                    type="text"
                    required
                    value={cCompany}
                    onChange={(e) => setCCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Plan Tier</label>
                  <select
                    value={cPlan}
                    onChange={(e) => setCPlan(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {PLAN_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {PLAN_LABELS[tier]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Account Notes</label>
                <textarea
                  rows={3}
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustModal({ open: false, editing: null })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCust}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  {savingCust ? "Saving…" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Canned Macro Modal */}
      {cannedModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {cannedModal.editing ? "Edit Canned Response" : "Create Canned Response"}
              </h2>
              <button
                type="button"
                onClick={() => setCannedModal({ open: false, editing: null })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMacro} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Macro Title</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g., Duplicate Charge Refund Confirmation"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Shortcut</label>
                  <input
                    type="text"
                    required
                    value={mShortcut}
                    onChange={(e) => setMShortcut(e.target.value)}
                    placeholder="/refund"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Response Body</label>
                <textarea
                  rows={5}
                  required
                  minLength={8}
                  value={mBody}
                  onChange={(e) => setMBody(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCannedModal({ open: false, editing: null })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMacro}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  {savingMacro ? "Saving…" : "Save Macro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
