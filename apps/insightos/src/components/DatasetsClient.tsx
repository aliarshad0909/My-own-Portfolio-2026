"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileUp,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
} from "lucide-react";
import { formatCategoryBadge } from "@/lib/format";
import type { DatasetCategory, DatasetSummary, RowData } from "@/lib/types";

const SAMPLE_CSV_TEMPLATE = `month,region,product_line,revenue_usd,units_sold,margin_pct
2026-01,North America,Telemetry Pro,54000,120,74.5
2026-02,North America,Telemetry Pro,61200,136,75.2
2026-02,EMEA,Cloud Connectors,38400,96,68.0
2026-03,North America,Telemetry Pro,68900,152,76.4
2026-03,APAC,Cloud Connectors,44200,110,70.1
2026-04,EMEA,Telemetry Pro,72500,160,77.0
2026-05,North America,Telemetry Pro,81000,178,78.1
2026-06,APAC,Telemetry Pro,89400,196,79.3`;

type PreviewRow = {
  rowIndex: number;
  data: RowData;
};

export function DatasetsClient() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewTotal, setPreviewTotal] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // CSV upload form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DatasetCategory>("custom");
  const [description, setDescription] = useState("");
  const [csvText, setCsvText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadPreview = useCallback(async (datasetId: string, query = "") => {
    if (!datasetId) return;
    setLoadingPreview(true);
    try {
      const qs = new URLSearchParams({ limit: "80" });
      if (query.trim()) qs.set("search", query.trim());
      const res = await fetch(`/api/datasets/${datasetId}?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setPreviewRows(data.rows || []);
      setPreviewTotal(data.totalMatched ?? 0);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const loadDatasets = useCallback(
    async (preferId?: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/datasets");
        if (!res.ok) return;
        const data = await res.json();
        const list: DatasetSummary[] = data.datasets || [];
        setDatasets(list);
        const targetId = preferId && list.some((d) => d.id === preferId) ? preferId : list[0]?.id || "";
        setSelectedId(targetId);
        if (targetId) {
          await loadPreview(targetId, "");
        }
      } finally {
        setLoading(false);
      }
    },
    [loadPreview],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDatasets();
    }, 0);
    const onReset = () => {
      void loadDatasets();
    };
    window.addEventListener("insightos:workspace-reset", onReset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("insightos:workspace-reset", onReset);
    };
  }, [loadDatasets]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    if (!name.trim()) {
      setName(file.name.replace(/\.csv$/i, ""));
    }
    const text = await file.text();
    setCsvText(text);
    setFeedback(null);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Imported CSV Dataset",
          category,
          description: description.trim(),
          csvText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error || "CSV import failed." });
        return;
      }
      setFeedback({
        type: "ok",
        text: `Imported "${data.dataset.name}" (${data.dataset.rowCount} validated rows, ${data.dataset.columns.length} columns) into PostgreSQL.`,
      });
      setName("");
      setDescription("");
      setCsvText("");
      setSelectedFileName(null);
      setSearchTerm("");
      await loadDatasets(data.dataset.id);
    } catch {
      setFeedback({ type: "err", text: "Network error while uploading CSV." });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, dsName: string) {
    setFeedback(null);
    const res = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeedback({ type: "ok", text: `Deleted dataset "${dsName}".` });
      await loadDatasets();
    } else {
      const data = await res.json();
      setFeedback({ type: "err", text: data.error || "Could not delete dataset." });
    }
  }

  const activeDataset = datasets.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            CSV Upload, Validation &amp; Data Sources
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload CSV files or paste tabular records for automatic type inference, data quality checks, PostgreSQL persistence, and safe CSV export.
          </p>
        </div>
        {activeDataset && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={`/api/datasets/${activeDataset.id}/export`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#06b6d4] hover:text-[#0891b2]"
            >
              <Download className="h-3.5 w-3.5 text-[#0891b2]" />
              <span>Export CSV</span>
            </a>
            <Link
              href={`/explorer?datasetId=${activeDataset.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0891b2]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#22d3ee]" />
              <span>Explore Selected</span>
            </Link>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "ok"
              ? "border-cyan-200 bg-cyan-50 text-cyan-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0891b2]" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Grid: CSV Importer + Catalog */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* CSV Importer */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827] text-[#22d3ee]">
                <FileUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Import CSV Dataset</h2>
                <p className="text-[11px] text-slate-500">Max 500 KB · up to 2,000 rows · 40 cols</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setName("Q1-Q2 Regional Telemetry Upload");
                setCategory("sales");
                setDescription("Sample uploaded CSV demonstrating schema inference and trend analysis.");
                setCsvText(SAMPLE_CSV_TEMPLATE);
                setSelectedFileName("sample-telemetry.csv");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-[#0891b2] transition hover:bg-cyan-100"
            >
              <Sparkles className="h-3 w-3" />
              <span>Load Template</span>
            </button>
          </div>

          <form onSubmit={handleImport} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Dataset Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q2 SaaS Revenue"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DatasetCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
                >
                  <option value="custom">Custom CSV</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="inventory">Inventory</option>
                  <option value="financial">Financial</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief note about data source or business unit"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Upload CSV File
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 transition hover:border-[#06b6d4] hover:bg-cyan-50/40">
                <span className="truncate">
                  {selectedFileName ? `Selected: ${selectedFileName}` : "Choose a local .csv file..."}
                </span>
                <span className="ml-2 shrink-0 rounded-md bg-[#111827] px-2.5 py-1 text-[11px] font-semibold text-white">
                  Browse
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Or Paste Raw CSV Content
              </label>
              <textarea
                rows={5}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="month,region,revenue_usd,deals&#10;2026-01,North America,42000,6"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 font-mono text-[11px] text-slate-800 outline-none focus:border-[#06b6d4] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !csvText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#06b6d4] disabled:opacity-50"
            >
              <FileUp className="h-4 w-4" />
              <span>{uploading ? "Validating & Saving..." : "Validate & Import to PostgreSQL"}</span>
            </button>
          </form>
        </section>

        {/* Dataset Catalog */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0891b2]" />
              <h2 className="text-sm font-bold text-slate-900">
                Persisted Data Sources ({datasets.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Click any source to inspect schema &amp; rows</span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading datasets...</p>
          ) : (
            <div className="space-y-2.5">
              {datasets.map((ds) => {
                const selected = ds.id === selectedId;
                return (
                  <div
                    key={ds.id}
                    onClick={() => {
                      setSelectedId(ds.id);
                      setSearchTerm("");
                      void loadPreview(ds.id, "");
                    }}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      selected
                        ? "border-[#06b6d4] bg-cyan-50/40 ring-1 ring-[#06b6d4]/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-900">{ds.name}</h3>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {formatCategoryBadge(ds.category)}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              ds.sourceType === "sample"
                                ? "bg-slate-800 text-slate-100"
                                : "bg-cyan-100 text-cyan-900"
                            }`}
                          >
                            {ds.sourceType === "sample" ? "Fictional Demo" : "CSV Upload"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{ds.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 tabular-nums">
                          <span>
                            <strong className="text-slate-800">{ds.rowCount}</strong> rows
                          </span>
                          <span>
                            <strong className="text-slate-800">{ds.columns.length}</strong> columns
                          </span>
                          <span>
                            Missing cells:{" "}
                            <strong className="text-slate-800">
                              {ds.validationSummary.missingCells ?? 0}
                            </strong>
                          </span>
                          <span>
                            Malformed rows:{" "}
                            <strong className="text-slate-800">
                              {ds.validationSummary.malformedRows ?? 0}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={`/api/datasets/${ds.id}/export`}
                          title="Download CSV"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-[#06b6d4] hover:text-[#0891b2]"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <Link
                          href={`/explorer?datasetId=${ds.id}`}
                          title="Open in Chart Explorer"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-[#06b6d4] hover:text-[#0891b2]"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Link>
                        {ds.sourceType === "csv_upload" && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(ds.id, ds.name)}
                            title="Delete uploaded dataset"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-300 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Automatic Data Validation Report + Interactive Data Preview */}
      {activeDataset && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-[#0891b2]" />
                <h2 className="text-base font-bold text-slate-900">
                  Schema Validation &amp; Live Data Preview — {activeDataset.name}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Showing {previewRows.length} of {previewTotal} matching rows stored in PostgreSQL `dataset_rows`.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void loadPreview(activeDataset.id, searchTerm);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter preview rows..."
                  className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-[#06b6d4] focus:bg-white sm:w-56"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0891b2]"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Column Type Inference & Validation Badges */}
          <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {activeDataset.columns.map((col) => (
              <div
                key={col.name}
                className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-semibold text-slate-900">
                    {col.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      col.type === "number"
                        ? "bg-cyan-100 text-cyan-900"
                        : col.type === "date"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {col.type}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
                  {col.distinctCount} distinct · {col.missingCount} missing
                </p>
              </div>
            ))}
          </div>

          {activeDataset.validationSummary.warnings?.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Validation Notes:</p>
              <ul className="mt-1 list-disc pl-4">
                {activeDataset.validationSummary.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsive Scrollable Data Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#111827] text-slate-200">
                  <th className="px-3 py-2.5 font-mono text-[11px] font-semibold text-slate-400">
                    #
                  </th>
                  {activeDataset.columns.map((col) => (
                    <th key={col.name} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loadingPreview ? (
                  <tr>
                    <td
                      colSpan={activeDataset.columns.length + 1}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Loading rows...
                    </td>
                  </tr>
                ) : previewRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeDataset.columns.length + 1}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No rows match this search query.
                    </td>
                  </tr>
                ) : (
                  previewRows.map((r) => (
                    <tr key={r.rowIndex} className="hover:bg-cyan-50/30">
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400 tabular-nums">
                        {r.rowIndex}
                      </td>
                      {activeDataset.columns.map((col) => {
                        const val = r.data[col.name];
                        return (
                          <td
                            key={col.name}
                            className={`whitespace-nowrap px-3 py-2 ${
                              col.type === "number" ? "font-mono text-slate-900 tabular-nums" : "text-slate-700"
                            }`}
                          >
                            {val === null || val === undefined ? (
                              <span className="italic text-slate-300">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
