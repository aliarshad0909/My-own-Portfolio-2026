"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileSpreadsheet,
  Globe2,
  PackageCheck,
  Plane,
  Ship,
  Truck,
} from "lucide-react";
import { formatCompactUsdCents, formatPct, formatUsdCents } from "@/lib/format";

type DashboardSummary = {
  kpis: {
    totalSuppliers: number;
    approvedSuppliers: number;
    openRfqs: number;
    activePoCount: number;
    totalPoCount: number;
    totalPoSpendCents: number;
    inTransitShipments: number;
    avgOnTimePct: number;
    pendingDocuments: number;
    savedScenarios: number;
  };
  topSuppliers: Array<{
    id: string;
    name: string;
    country: string;
    category: string;
    qualificationStatus: string;
    leadTimeDays: number;
    onTimePct: number;
    defectRatePct: number;
    rating: number;
  }>;
  recentRfqs: Array<{
    id: string;
    rfqNumber: string;
    title: string;
    targetQty: number;
    targetUnitCents: number;
    status: string;
    dueDate: string;
    quotationCount: number;
  }>;
  activeShipments: Array<{
    id: string;
    trackingCode: string;
    poNumber: string;
    itemName: string;
    supplierName: string;
    carrier: string;
    mode: string;
    originPort: string;
    destPort: string;
    status: string;
    etaDate: string;
    freightCents: number;
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    docType: string;
    entityRef: string;
    status: string;
  }>;
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    under_review: "bg-amber-50 text-amber-800 border-amber-200",
    probation: "bg-red-50 text-red-700 border-red-200",
    open: "bg-sky-50 text-sky-700 border-sky-200",
    evaluating: "bg-orange-50 text-orange-800 border-orange-200",
    awarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
    booked: "bg-slate-100 text-slate-700 border-slate-200",
    in_transit: "bg-sky-50 text-sky-700 border-sky-200",
    customs: "bg-amber-50 text-amber-800 border-amber-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    submitted: "bg-sky-50 text-sky-700 border-sky-200",
    pending_review: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return map[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function modeIcon(mode: string) {
  if (mode === "air") return <Plane className="h-3.5 w-3.5 text-sky-600" />;
  if (mode === "express") return <Truck className="h-3.5 w-3.5 text-[#ea580c]" />;
  return <Ship className="h-3.5 w-3.5 text-[#0f1d33]" />;
}

export function DashboardClient({ summary }: { summary: DashboardSummary }) {
  const { kpis } = summary;

  return (
    <div className="space-y-6">
      {/* Top Industrial Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d7dee8] bg-[#0f1d33] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#192d4d] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-orange-300">
            <Globe2 className="h-3.5 w-3.5 text-[#f97316]" />
            <span>Global Sourcing Control Tower</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Procurement Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Real-time supplier qualification health, active tender evaluations, purchase spend, and
            port-to-port freight visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/rfqs"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#ea580c] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Compare RFQs</span>
          </Link>
          <Link
            href="/landed-cost"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-[#172a47] px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-orange-400 hover:text-white"
          >
            <Calculator className="h-4 w-4 text-[#f97316]" />
            <span>Landed-Cost Model</span>
          </Link>
        </div>
      </div>

      {/* 5 Primary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#d7dee8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Suppliers
            </span>
            <Factory className="h-4 w-4 text-[#0f1d33]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0f1d33]">{kpis.totalSuppliers}</p>
          <p className="mt-1 text-xs text-emerald-700">
            {kpis.approvedSuppliers} qualified &amp; approved
          </p>
        </div>

        <div className="rounded-xl border border-[#d7dee8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open RFQs
            </span>
            <FileSpreadsheet className="h-4 w-4 text-[#ea580c]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0f1d33]">{kpis.openRfqs}</p>
          <p className="mt-1 text-xs text-slate-600">Active bid sheets awaiting award</p>
        </div>

        <div className="rounded-xl border border-[#d7dee8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              POs &amp; Spend
            </span>
            <PackageCheck className="h-4 w-4 text-[#0f1d33]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0f1d33]">
            {formatCompactUsdCents(kpis.totalPoSpendCents)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {kpis.activePoCount} active / {kpis.totalPoCount} total POs
          </p>
        </div>

        <div className="rounded-xl border border-[#d7dee8] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In-Transit Freight
            </span>
            <Ship className="h-4 w-4 text-[#ea580c]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0f1d33]">{kpis.inTransitShipments}</p>
          <p className="mt-1 text-xs text-slate-600">
            {kpis.pendingDocuments} trade docs pending review
          </p>
        </div>

        <div className="rounded-xl border border-[#d7dee8] bg-white p-4 shadow-xs sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg On-Time OTD
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0f1d33]">
            {formatPct(kpis.avgOnTimePct)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {kpis.savedScenarios} landed-cost models saved
          </p>
        </div>
      </section>

      {/* Main Grid: Shipments + Recent RFQs */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Active Shipments Radar */}
        <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0f1d33]">Active Shipments &amp; Freight Lanes</h2>
              <p className="text-xs text-slate-500">
                Port-to-port container and air cargo visibility linked to Purchase Orders
              </p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea580c] hover:underline"
            >
              <span>Manage Freight</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2.5 pr-3 font-semibold">Tracking / PO</th>
                  <th className="pb-2.5 pr-3 font-semibold">Corridor</th>
                  <th className="pb-2.5 pr-3 font-semibold">Carrier</th>
                  <th className="pb-2.5 pr-3 font-semibold">ETA</th>
                  <th className="pb-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.activeShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3">
                      <p className="font-mono font-semibold text-[#0f1d33]">{s.trackingCode}</p>
                      <p className="text-[11px] text-slate-500">{s.poNumber}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800">{s.originPort}</p>
                      <p className="text-[11px] text-slate-500">→ {s.destPort}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        {modeIcon(s.mode)}
                        <span>{s.carrier}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Freight {formatUsdCents(s.freightCents)}
                      </p>
                    </td>
                    <td className="py-3 pr-3 font-mono text-slate-700">{s.etaDate}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(s.status)}`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent RFQs & Action Queue */}
        <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0f1d33]">Recent RFQs &amp; Tender Queue</h2>
              <p className="text-xs text-slate-500">Open bid comparisons ready for award</p>
            </div>
            <Link
              href="/rfqs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea580c] hover:underline"
            >
              <span>All RFQs</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {summary.recentRfqs.map((rfq) => (
              <Link
                key={rfq.id}
                href="/rfqs"
                className="block rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-orange-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-[#ea580c]">
                      {rfq.rfqNumber}
                    </span>
                    <p className="truncate text-sm font-semibold text-[#0f1d33]">{rfq.title}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(rfq.status)}`}
                  >
                    {rfq.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Qty {rfq.targetQty.toLocaleString()} · Target{" "}
                    {formatUsdCents(rfq.targetUnitCents)}/u
                  </span>
                  <span className="font-medium text-[#0f1d33]">
                    {rfq.quotationCount} quote{rfq.quotationCount === 1 ? "" : "s"} · Due{" "}
                    {rfq.dueDate}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Row: Supplier Performance Scorecard + Trade Compliance Checklist */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0f1d33]">Supplier Performance Scorecard</h2>
              <p className="text-xs text-slate-500">
                Top global manufacturing partners ranked by On-Time Delivery % and Defect Rate
              </p>
            </div>
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea580c] hover:underline"
            >
              <span>Supplier Directory</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2.5 pr-3 font-semibold">Supplier</th>
                  <th className="pb-2.5 pr-3 font-semibold">Category</th>
                  <th className="pb-2.5 pr-3 font-semibold">Lead Time</th>
                  <th className="pb-2.5 pr-3 font-semibold">On-Time %</th>
                  <th className="pb-2.5 pr-3 font-semibold">Defect %</th>
                  <th className="pb-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.topSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-[#0f1d33]">{sup.name}</p>
                      <p className="text-[11px] text-slate-500">{sup.country}</p>
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{sup.category}</td>
                    <td className="py-3 pr-3 font-mono text-slate-700">{sup.leadTimeDays}d</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[#ea580c]"
                            style={{ width: `${Math.min(100, sup.onTimePct)}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-[#0f1d33]">
                          {formatPct(sup.onTimePct)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-slate-700">
                      {formatPct(sup.defectRatePct, 2)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(sup.qualificationStatus)}`}
                      >
                        {sup.qualificationStatus.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7dee8] bg-white p-5 shadow-xs xl:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0f1d33]">Trade Compliance Docs</h2>
              <p className="text-xs text-slate-500">Customs clearance &amp; QC packet status</p>
            </div>
            <ClipboardCheck className="h-4 w-4 text-[#ea580c]" />
          </div>

          <div className="mt-4 space-y-2.5">
            {summary.recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#0f1d33]">{doc.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(doc.status)}`}
                  >
                    {doc.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{doc.entityRef}</span>
                  <span className="capitalize">{doc.docType.replaceAll("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/orders"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0f1d33] transition hover:bg-slate-50"
          >
            <span>Open Trade Document Checklist</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#ea580c]" />
          </Link>
        </section>
      </div>
    </div>
  );
}
