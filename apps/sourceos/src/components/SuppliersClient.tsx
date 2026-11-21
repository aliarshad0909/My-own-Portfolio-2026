"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Factory,
  Filter,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";
import type { QualificationStatus } from "@/db/schema";
import { useToast } from "@/components/ToastProvider";
import { formatPct } from "@/lib/format";

type SupplierRow = {
  id: string;
  name: string;
  country: string;
  category: string;
  qualificationStatus: string;
  leadTimeDays: number;
  onTimePct: number;
  defectRatePct: number;
  certifications: string;
  rating: number;
  contactEmail: string;
  notes: string;
};

function statusChip(status: string) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "probation") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function SuppliersClient({ initialSuppliers }: { initialSuppliers: SupplierRow[] }) {
  const { notify } = useToast();
  const [list, setList] = useState<SupplierRow[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialSuppliers[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  // Add supplier form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("CNC Machining");
  const [qualificationStatus, setQualificationStatus] =
    useState<QualificationStatus>("under_review");
  const [leadTimeDays, setLeadTimeDays] = useState("21");
  const [onTimePct, setOnTimePct] = useState("96.0");
  const [defectRatePct, setDefectRatePct] = useState("0.5");
  const [certifications, setCertifications] = useState("ISO 9001, RoHS");
  const [rating, setRating] = useState("4.5");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  const countries = useMemo(
    () => Array.from(new Set(list.map((s) => s.country))).sort(),
    [list],
  );
  const categories = useMemo(
    () => Array.from(new Set(list.map((s) => s.category))).sort(),
    [list],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((s) => {
      if (countryFilter !== "all" && s.country !== countryFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (statusFilter !== "all" && s.qualificationStatus !== statusFilter) return false;
      if (
        q &&
        !`${s.name} ${s.country} ${s.category} ${s.certifications}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [list, search, countryFilter, categoryFilter, statusFilter]);

  const selectedSupplier = useMemo(
    () => list.find((s) => s.id === selectedId) ?? filtered[0] ?? null,
    [list, selectedId, filtered],
  );

  async function updateQualification(supplierId: string, nextStatus: QualificationStatus) {
    setBusyId(supplierId);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualificationStatus: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Could not update supplier status.", "error");
        return;
      }
      setList((prev) => prev.map((s) => (s.id === supplierId ? data.supplier : s)));
      notify(`Supplier qualification moved to "${nextStatus.replace("_", " ")}".`);
    } catch {
      notify("Network error updating supplier.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateSupplier(e: FormEvent) {
    e.preventDefault();
    setSavingNew(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          country,
          category,
          qualificationStatus,
          leadTimeDays: Number(leadTimeDays),
          onTimePct: Number(onTimePct),
          defectRatePct: Number(defectRatePct),
          certifications,
          rating: Number(rating),
          contactEmail,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to create supplier.", "error");
        return;
      }
      setList((prev) => [data.supplier, ...prev]);
      setSelectedId(data.supplier.id);
      setShowCreate(false);
      setName("");
      setCountry("");
      setContactEmail("");
      setNotes("");
      notify(`Added supplier "${data.supplier.name}" to directory.`);
    } catch {
      notify("Network error adding supplier.", "error");
    } finally {
      setSavingNew(false);
    }
  }

  const approvedCount = list.filter((s) => s.qualificationStatus === "approved").length;
  const reviewCount = list.filter((s) => s.qualificationStatus === "under_review").length;
  const probationCount = list.filter((s) => s.qualificationStatus === "probation").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">
            Vendor Qualification &amp; Compliance
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f1d33]">
            Global Supplier Directory
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Audit manufacturing capabilities, certifications, OTD scorecards, and approve or place
            vendors on probation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showCreate ? "Close Form" : "Add Supplier"}</span>
        </button>
      </div>

      {/* Status Summary Pills */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-[#d7dee8] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Approved Vendors</p>
            <p className="text-xl font-bold text-[#0f1d33]">{approvedCount}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#d7dee8] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Under Audit Review</p>
            <p className="text-xl font-bold text-[#0f1d33]">{reviewCount}</p>
          </div>
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#d7dee8] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">CAPA / Probation</p>
            <p className="text-xl font-bold text-[#0f1d33]">{probationCount}</p>
          </div>
          <ShieldAlert className="h-5 w-5 text-red-600" />
        </div>
      </div>

      {/* Add Supplier Drawer Card */}
      {showCreate ? (
        <form
          onSubmit={handleCreateSupplier}
          className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-[#0f1d33]">Onboard New Global Supplier</h2>
            <span className="text-xs text-slate-500">Persists directly to PostgreSQL</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Supplier Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., NordStahl Components AB"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Country *</label>
              <input
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Sweden"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Category *</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., CNC Machining"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Qualification Status
              </label>
              <select
                value={qualificationStatus}
                onChange={(e) => setQualificationStatus(e.target.value as QualificationStatus)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              >
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="probation">Probation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Lead Time (Days)</label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">On-Time %</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                required
                value={onTimePct}
                onChange={(e) => setOnTimePct(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Defect Rate %</label>
              <input
                type="number"
                step="0.05"
                min={0}
                max={100}
                required
                value={defectRatePct}
                onChange={(e) => setDefectRatePct(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={5}
                required
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Certifications</label>
              <input
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="ISO 9001, IATF 16949, RoHS"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="tenders@supplier.example"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700">Audit &amp; Sourcing Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Factory audit highlights, tooling capacity, incoterm preferences…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#ea580c] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingNew}
              className="rounded-lg bg-[#0f1d33] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a2f50] disabled:opacity-60"
            >
              {savingNew ? "Saving…" : "Create Supplier"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#d7dee8] bg-white p-3.5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier, certification, country, or category…"
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-[#ea580c] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="hidden h-4 w-4 text-slate-400 md:block" />
          <select
            aria-label="Filter by country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by qualification status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="under_review">Under Review</option>
            <option value="probation">Probation</option>
          </select>
        </div>
      </div>

      {/* Directory Table + Detailed Profile Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-[#d7dee8] bg-white p-4 shadow-xs xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2.5 pr-3 font-semibold">Supplier</th>
                  <th className="pb-2.5 pr-3 font-semibold">Category</th>
                  <th className="pb-2.5 pr-3 font-semibold">Lead Time</th>
                  <th className="pb-2.5 pr-3 font-semibold">OTD / Defect</th>
                  <th className="pb-2.5 pr-3 font-semibold">Rating</th>
                  <th className="pb-2.5 text-right font-semibold">Qualification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const isSelected = selectedSupplier?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-orange-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-[#0f1d33]">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.country}</p>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{s.category}</td>
                      <td className="py-3 pr-3 font-mono text-slate-700">{s.leadTimeDays}d</td>
                      <td className="py-3 pr-3 font-mono text-slate-700">
                        <span className="font-semibold text-[#0f1d33]">
                          {formatPct(s.onTimePct)}
                        </span>{" "}
                        <span className="text-slate-400">/</span>{" "}
                        <span>{formatPct(s.defectRatePct, 2)}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#0f1d33]">
                          <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                          {s.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusChip(s.qualificationStatus)}`}
                        >
                          {s.qualificationStatus.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No suppliers match the active filter criteria.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Detailed Profile & Qualification Workflow */}
        <aside className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-4">
          {selectedSupplier ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">
                    <Factory className="h-3.5 w-3.5" />
                    <span>{selectedSupplier.country}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-[#0f1d33]">
                    {selectedSupplier.name}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedSupplier.category}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusChip(selectedSupplier.qualificationStatus)}`}
                >
                  {selectedSupplier.qualificationStatus.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Lead Time</p>
                  <p className="mt-1 font-mono text-base font-bold text-[#0f1d33]">
                    {selectedSupplier.leadTimeDays}d
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">On-Time</p>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-700">
                    {formatPct(selectedSupplier.onTimePct)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Defect Rate</p>
                  <p className="mt-1 font-mono text-base font-bold text-[#0f1d33]">
                    {formatPct(selectedSupplier.defectRatePct, 2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Award className="h-3.5 w-3.5 text-[#ea580c]" />
                  <span>Certifications</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedSupplier.certifications
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .map((cert) => (
                      <span
                        key={cert}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700"
                      >
                        {cert}
                      </span>
                    ))}
                </div>
              </div>

              {selectedSupplier.contactEmail ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate font-mono">{selectedSupplier.contactEmail}</span>
                </div>
              ) : null}

              <div>
                <p className="text-xs font-semibold text-slate-700">Audit &amp; Capability Notes</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {selectedSupplier.notes || "No audit notes recorded yet."}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Qualification Workflow Actions
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  <button
                    type="button"
                    disabled={
                      busyId === selectedSupplier.id ||
                      selectedSupplier.qualificationStatus === "approved"
                    }
                    onClick={() => updateQualification(selectedSupplier.id, "approved")}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-45"
                  >
                    Approve Supplier
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyId === selectedSupplier.id ||
                      selectedSupplier.qualificationStatus === "under_review"
                    }
                    onClick={() => updateQualification(selectedSupplier.id, "under_review")}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-45"
                  >
                    Move to Under Review
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyId === selectedSupplier.id ||
                      selectedSupplier.qualificationStatus === "probation"
                    }
                    onClick={() => updateQualification(selectedSupplier.id, "probation")}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-45"
                  >
                    Place on Probation (CAPA)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a supplier to view qualification details.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
