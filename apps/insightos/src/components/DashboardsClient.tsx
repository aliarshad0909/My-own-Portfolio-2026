"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { formatCategoryBadge, formatFieldLabel, formatMetricValue } from "@/lib/format";
import type { AnalyticsQueryResult, SavedDashboardRecord } from "@/lib/types";

type ExecutiveReportData = {
  dashboard: SavedDashboardRecord;
  analytics: AnalyticsQueryResult;
  generatedAt: string;
};

export function DashboardsClient() {
  const [dashboards, setDashboards] = useState<SavedDashboardRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ExecutiveReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadReport = useCallback(async (id: string) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/dashboards/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedReport({
        dashboard: data.dashboard,
        analytics: data.analytics,
        generatedAt: data.generatedAt,
      });
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboards");
      if (!res.ok) return;
      const data = await res.json();
      const list: SavedDashboardRecord[] = data.dashboards || [];
      setDashboards(list);
      if (list.length > 0) {
        await loadReport(list[0].id);
      } else {
        setSelectedReport(null);
      }
    } finally {
      setLoading(false);
    }
  }, [loadReport]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboards();
    }, 0);
    const onReset = () => {
      void loadDashboards();
    };
    window.addEventListener("insightos:workspace-reset", onReset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("insightos:workspace-reset", onReset);
    };
  }, [loadDashboards]);

  async function handleDelete(id: string, name: string) {
    const res = await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeedback(`Deleted saved dashboard "${name}".`);
      await loadDashboards();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Saved Dashboards &amp; Executive Summary Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Re-open persisted BI views in the Explorer, generate structured executive briefings from live PostgreSQL records, and export report CSVs.
          </p>
        </div>
        <Link
          href="/explorer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0891b2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#06b6d4]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>New Dashboard</span>
        </Link>
      </div>

      {feedback && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-medium text-cyan-900">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Saved Dashboards List */}
        <section className="space-y-3 xl:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#0891b2]" />
              <h2 className="text-sm font-bold text-slate-900">
                Saved Configurations ({dashboards.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              Loading saved dashboards...
            </div>
          ) : dashboards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No saved dashboards yet. Build one in the{" "}
              <Link href="/explorer" className="font-semibold text-[#0891b2] underline">
                Chart Explorer
              </Link>
              .
            </div>
          ) : (
            dashboards.map((dash) => {
              const active = selectedReport?.dashboard.id === dash.id;
              return (
                <div
                  key={dash.id}
                  onClick={() => void loadReport(dash.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    active
                      ? "border-[#06b6d4] bg-white shadow-sm ring-1 ring-[#06b6d4]/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-sm font-bold text-slate-900">{dash.name}</h3>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          {dash.config.chartType}
                        </span>
                        {dash.config.showForecast && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            3P Forecast
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{dash.description}</p>
                      <p className="mt-2 font-mono text-[11px] text-slate-600">
                        {dash.config.aggregation.toUpperCase()}({dash.config.yField}) · by {dash.config.xField}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Source: {dash.datasetName} ({formatCategoryBadge(dash.datasetCategory)})
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => void loadReport(dash.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0891b2]"
                    >
                      <FileText className="h-3 w-3 text-[#22d3ee]" />
                      <span>Executive Report</span>
                    </button>
                    <Link
                      href={`/explorer?dashboardId=${dash.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#06b6d4] hover:text-[#0891b2]"
                    >
                      <span>Open in Explorer</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <a
                      href={`/api/dashboards/${dash.id}?format=csv`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#06b6d4] hover:text-[#0891b2]"
                    >
                      <Download className="h-3 w-3" />
                      <span>CSV</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleDelete(dash.id, dash.name)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600"
                      title="Delete dashboard"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Executive Summary Report Viewer */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-7 sm:p-6">
          {loadingReport ? (
            <div className="flex h-96 items-center justify-center text-sm text-slate-400">
              Generating live executive report from PostgreSQL...
            </div>
          ) : !selectedReport ? (
            <div className="flex h-96 items-center justify-center text-sm text-slate-400">
              Select a saved dashboard to generate an Executive Summary Report.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#111827] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee]">
                      <Sparkles className="h-3 w-3" />
                      Executive Summary Report
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Generated {new Date(selectedReport.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    {selectedReport.dashboard.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Dataset: {selectedReport.dashboard.datasetName} (
                    {selectedReport.dashboard.datasetSourceType === "sample"
                      ? "Fictional Demonstration Dataset"
                      : "Uploaded CSV"}
                    )
                  </p>
                </div>

                <a
                  href={`/api/dashboards/${selectedReport.dashboard.id}?format=csv`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0891b2] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#06b6d4]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Report CSV</span>
                </a>
              </div>

              {/* Structured KPI Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Total Metric</p>
                  <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                    {formatMetricValue(
                      selectedReport.analytics.kpis.metricSum,
                      selectedReport.dashboard.config.yField,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Mean / Record</p>
                  <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                    {formatMetricValue(
                      selectedReport.analytics.kpis.metricAvg,
                      selectedReport.dashboard.config.yField,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">
                    {selectedReport.analytics.kpis.periodGrowthPct !== null ? "Period Delta" : "Top Segment Share"}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                    {selectedReport.analytics.kpis.periodGrowthPct !== null
                      ? `${selectedReport.analytics.kpis.periodGrowthPct >= 0 ? "+" : ""}${selectedReport.analytics.kpis.periodGrowthPct}%`
                      : `${selectedReport.analytics.topSegments[0]?.sharePct ?? 0}%`}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Rows Analyzed</p>
                  <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                    {selectedReport.analytics.kpis.matchedRows}
                  </p>
                </div>
              </div>

              {/* Automated Narrative Findings Derived Strictly from DB Rows */}
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 text-xs leading-relaxed text-slate-200">
                <p className="mb-1.5 font-semibold text-[#22d3ee]">Key Findings (Computed from Live DB Rows)</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    Evaluated <strong>{selectedReport.analytics.kpis.matchedRows}</strong> records out of{" "}
                    <strong>{selectedReport.analytics.kpis.totalRows}</strong> total rows, yielding a cumulative{" "}
                    <strong>{formatFieldLabel(selectedReport.dashboard.config.yField)}</strong> of{" "}
                    <strong>
                      {formatMetricValue(
                        selectedReport.analytics.kpis.metricSum,
                        selectedReport.dashboard.config.yField,
                      )}
                    </strong>
                    .
                  </li>
                  {selectedReport.analytics.kpis.topSegment && (
                    <li>
                      Top contributing segment is <strong>{selectedReport.analytics.kpis.topSegment}</strong> at{" "}
                      <strong>
                        {formatMetricValue(
                          selectedReport.analytics.kpis.topSegmentValue,
                          selectedReport.dashboard.config.yField,
                        )}
                      </strong>{" "}
                      ({selectedReport.analytics.topSegments[0]?.sharePct ?? 0}% of total).
                    </li>
                  )}
                  {selectedReport.analytics.forecast.enabled && selectedReport.analytics.forecast.available && (
                    <li>
                      Linear OLS trend (slope {selectedReport.analytics.forecast.slope}, R² ={" "}
                      {selectedReport.analytics.forecast.rSquared}) projects next period at{" "}
                      <strong>
                        {formatMetricValue(
                          selectedReport.analytics.forecast.projectedPoints[0]?.value ?? 0,
                          selectedReport.dashboard.config.yField,
                        )}
                      </strong>
                      .
                    </li>
                  )}
                </ul>
              </div>

              {/* Chart Snapshot */}
              <AnalyticsChart
                series={selectedReport.analytics.series}
                chartType={selectedReport.dashboard.config.chartType}
                yField={selectedReport.dashboard.config.yField}
                showForecast={Boolean(selectedReport.dashboard.config.showForecast)}
                height={260}
              />

              {/* Top Segments Table */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-3.5 py-2 font-semibold">Segment</th>
                      <th className="px-3.5 py-2 font-semibold">Records</th>
                      <th className="px-3.5 py-2 text-right font-semibold">Aggregated Value</th>
                      <th className="px-3.5 py-2 text-right font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReport.analytics.topSegments.map((seg) => (
                      <tr key={seg.label}>
                        <td className="px-3.5 py-2 font-semibold text-slate-800">{seg.label}</td>
                        <td className="px-3.5 py-2 text-slate-500 tabular-nums">{seg.count}</td>
                        <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatMetricValue(seg.value, selectedReport.dashboard.config.yField)}
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono text-[#0891b2] tabular-nums">
                          {seg.sharePct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
