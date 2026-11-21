"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  Plus,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type EmployeeLite = {
  id: string;
  fullName: string;
  employeeCode: string;
};

type ReviewRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeTitle: string;
  employeeCode: string;
  cycle: string;
  reviewerName: string;
  rating: number;
  summary: string;
  goals: string;
};

type DocumentRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  title: string;
  docType: "offer_letter" | "policy_ack" | "nda" | "id_verified";
  status: "verified" | "pending" | "expired";
  uploadedDate: string;
};

const DOC_TYPE_LABELS: Record<DocumentRow["docType"], string> = {
  offer_letter: "Offer Letter",
  policy_ack: "Policy Ack",
  nda: "Mutual NDA",
  id_verified: "ID Verification",
};

export default function ReviewsAndDocumentsPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);

  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    cycle: "2026 H2 Review",
    reviewerName: "Hannah Reyes",
    rating: "4",
    summary: "",
    goals: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [docForm, setDocForm] = useState(() => ({
    employeeId: "",
    title: "",
    docType: "policy_ack",
    status: "verified",
    uploadedDate: new Date().toISOString().slice(0, 10),
  }));
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const load = useCallback(async () => {
    const [empRes, revRes, docRes] = await Promise.all([
      fetch("/api/employees", { cache: "no-store" }),
      fetch("/api/reviews", { cache: "no-store" }),
      fetch("/api/documents", { cache: "no-store" }),
    ]);

    if (empRes.ok) {
      const json = await empRes.json();
      const list = (json.employees ?? []) as EmployeeLite[];
      setEmployees(list);
      if (list[0]) {
        setReviewForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: list[0].id }));
        setDocForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: list[0].id }));
      }
    }
    if (revRes.ok) {
      const json = await revRes.json();
      setReviews(json.reviews ?? []);
    }
    if (docRes.ok) {
      const json = await docRes.json();
      setDocuments(json.documents ?? []);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    window.addEventListener("peopleos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("peopleos:refresh", onRefresh);
    };
  }, [load]);

  async function handleAddReview(e: FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewForm,
          rating: Number(reviewForm.rating),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to save performance review.", "error");
        return;
      }
      toast("Performance review published.", "success");
      setReviewForm((prev) => ({ ...prev, summary: "", goals: "" }));
      await load();
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleAddDoc(e: FormEvent) {
    e.preventDefault();
    setSubmittingDoc(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to register document.", "error");
        return;
      }
      toast("Compliance document registered.", "success");
      setDocForm((prev) => ({ ...prev, title: "" }));
      await load();
    } finally {
      setSubmittingDoc(false);
    }
  }

  async function handleToggleDocStatus(doc: DocumentRow) {
    const nextStatus = doc.status === "verified" ? "pending" : "verified";
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Unable to update document status.", "error");
      return;
    }
    toast(`Document marked as ${nextStatus}.`, "success");
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Performance Reviews &amp; Compliance Documents
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Run structured review cycles and track employee compliance records (offer letters, NDAs, policy acknowledgments,
          and ID verifications).
        </p>
      </div>

      {/* Performance Reviews Section */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#16a34a]" />
            <h2 className="text-base font-bold text-slate-900">Performance Review Cycles</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                      {rev.cycle}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">{rev.employeeName}</h3>
                    <p className="text-[11px] text-slate-500">
                      {rev.employeeTitle} · Reviewer: {rev.reviewerName}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {rev.rating}/5
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Summary</p>
                    <p className="mt-0.5 leading-relaxed text-slate-700">{rev.summary}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-[#f6f8f7] p-2.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Next-Cycle Goals</p>
                    <p className="mt-0.5 leading-relaxed text-slate-800">{rev.goals}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4">
          <h2 className="text-base font-bold text-slate-900">Publish Performance Review</h2>
          <p className="mt-1 text-xs text-slate-500">Record a cycle evaluation and development goals.</p>

          <form onSubmit={handleAddReview} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Employee</label>
              <select
                required
                value={reviewForm.employeeId}
                onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700">Cycle</label>
                <input
                  required
                  value={reviewForm.cycle}
                  onChange={(e) => setReviewForm({ ...reviewForm, cycle: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Reviewer</label>
              <input
                required
                value={reviewForm.reviewerName}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Performance Summary</label>
              <textarea
                required
                rows={2}
                value={reviewForm.summary}
                onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
                placeholder="Key accomplishments and cross-team impact…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Next-Cycle Goals</label>
              <textarea
                required
                rows={2}
                value={reviewForm.goals}
                onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })}
                placeholder="Concrete milestones for the upcoming cycle…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview || !reviewForm.employeeId}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2.5 font-semibold text-white hover:bg-[#15803d] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{submittingReview ? "Publishing…" : "Publish Review"}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Employee Document Compliance Checklist */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#16a34a]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Employee Document Compliance Checklist</h2>
                <p className="text-xs text-slate-500">
                  Offer letters, NDAs, policy acknowledgments, and ID verification records.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-[#f6f8f7] text-[11px] font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Document</th>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Uploaded</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#f6f8f7]/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{doc.title}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.employeeName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {DOC_TYPE_LABELS[doc.docType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{doc.uploadedDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          doc.status === "verified"
                            ? "bg-green-100 text-[#15803d]"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status === "verified" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleToggleDocStatus(doc)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#16a34a] hover:text-[#15803d]"
                      >
                        {doc.status === "verified" ? "Mark Pending" : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4">
          <h2 className="text-base font-bold text-slate-900">Register Compliance Document</h2>
          <p className="mt-1 text-xs text-slate-500">Log a fictional compliance document record for an employee.</p>

          <form onSubmit={handleAddDoc} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Employee</label>
              <select
                required
                value={docForm.employeeId}
                onChange={(e) => setDocForm({ ...docForm, employeeId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Document Title</label>
              <input
                required
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="e.g. 2026 Security Policy Acknowledgment"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700">Category</label>
                <select
                  value={docForm.docType}
                  onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                >
                  <option value="offer_letter">Offer Letter</option>
                  <option value="policy_ack">Policy Ack</option>
                  <option value="nda">Mutual NDA</option>
                  <option value="id_verified">ID Verification</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Status</label>
                <select
                  value={docForm.status}
                  onChange={(e) => setDocForm({ ...docForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Uploaded Date</label>
              <input
                required
                type="date"
                value={docForm.uploadedDate}
                onChange={(e) => setDocForm({ ...docForm, uploadedDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={submittingDoc || !docForm.employeeId}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1e293b] px-4 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>{submittingDoc ? "Registering…" : "Register Document"}</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
