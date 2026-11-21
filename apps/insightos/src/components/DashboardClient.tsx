"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart2,
  Database,
  FileSpreadsheet,
  Info,
  Layers,
  LineChart as LineChartIcon,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { formatCategoryBadge, formatFieldLabel, formatMetricValue } from "@/lib/format";
import type {
  AnalyticsQueryResult,
  ChartType,
  ColumnMeta,
  DatasetSummary,
  SavedDashboardRecord,
} from "@/lib/types";

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
};

export function DashboardClient() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [dashboards, setDashboards] = useState<SavedDashboardRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [yField, setYField] = useState<string>("");
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [queryResult, setQueryResult] = useState<AnalyticsQueryResult | null>(null);
  const [activeColumns, setActiveColumns] = useState<ColumnMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDatasetQuery = useCallback(
    async (
      datasetId: string,
      opts?: { chartType?: ChartType; yField?: string; showForecast?: boolean },
    ) => {
      if (!datasetId) return;
      setQuerying(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datasetId,
            chartType: opts?.chartType,
            yField: opts?.yField || undefined,
            showForecast: opts?.showForecast,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to execute analytics query.");
          return;
        }
        setQueryResult(data.result);
        setActiveColumns(data.columns || []);
        setChartType(data.result.config.chartType);
        setYField(data.result.config.yField);
        setShowForecast(Boolean(data.result.config.showForecast));
      } catch {
        setError("Network error querying analytics data.");
      } finally {
        setQuerying(false);
      }
    },
    [],
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dsRes, dashRes] = await Promise.all([
        fetch("/api/datasets"),
        fetch("/api/dashboards"),
      ]);
      if (!dsRes.ok || !dashRes.ok) {
        setError("Unable to load workspace datasets.");
        return;
      }
      const dsData = await dsRes.json();
      const dashData = await dashRes.json();
      const list: DatasetSummary[] = dsData.datasets || [];
      setDatasets(list);
      setActivities(dsData.recentActivity || []);
      setDashboards(dashData.dashboards || []);

      const preferred =
        list.find((d) => d.slug === "sales-regional-2026") ?? list[0] ?? null;
      if (preferred) {
        setActiveDatasetId(preferred.id);
        await runDatasetQuery(preferred.id, { showForecast: true });
      }
    } catch {
      setError("Network error loading InsightOS workspace.");
    } finally {
      setLoading(false);
    }
  }, [runDatasetQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    const onReset = () => {
      void loadWorkspace();
    };
    window.addEventListener("insightos:workspace-reset", onReset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("insightos:workspace-reset", onReset);
    };
  }, [loadWorkspace]);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) ?? null;
  const numericColumns = activeColumns.filter((c) => c.type === "number");
  const totalRowsAcrossAll = datasets.reduce((sum, d) => sum + d.rowCount, 0);

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06b6d4]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#22d3ee] ring-1 ring-[#06b6d4]/40">
                <Database className="h-3 w-3" />
                Live PostgreSQL Analytics
              </span>
              <span className="text-xs text-slate-400">
                {datasets.length} datasets · {totalRowsAcrossAll.toLocaleString()} persisted rows ·{" "}
                {dashboards.length} saved dashboards
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Executive Business Intelligence Overview
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Switch between 5 fictional demonstration datasets or your uploaded CSV files. All KPIs, grouped series, and OLS 3-period trend projections calculate directly from stored records.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/datasets"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-100 transition hover:border-[#06b6d4] hover:text-[#22d3ee]"
            >
              <Database className="h-3.5 w-3.5 text-[#22d3ee]" />
              <span>Upload CSV</span>
            </Link>
            <Link
              href={activeDatasetId ? `/explorer?datasetId=${activeDatasetId}` : "/explorer"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#06b6d4] px-3.5 py-2 text-xs font-semibold text-[#111827] transition hover:bg-[#22d3ee]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Open in Explorer</span>
            </Link>
          </div>
        </div>

        {/* Dataset Selector Bar */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          {datasets.map((ds) => {
            const selected = ds.id === activeDatasetId;
            return (
              <button
                key={ds.id}
                type="button"
                onClick={() => {
                  setActiveDatasetId(ds.id);
                  void runDatasetQuery(ds.id, { showForecast: true });
                }}
                className={`inline-flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${
                  selected
                    ? "bg-[#06b6d4] text-[#111827] shadow-sm"
                    : "border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                <span className="truncate max-w-[200px] sm:max-w-[240px]">{ds.name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    selected ? "bg-[#111827]/15 text-[#111827]" : "bg-slate-800 text-cyan-300"
                  }`}
                >
                  {formatCategoryBadge(ds.category)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Live KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {queryResult ? `Total ${formatFieldLabel(queryResult.config.yField)}` : "Primary Metric"}
            </span>
            <span className="rounded-lg bg-cyan-50 p-2 text-[#0891b2]">
              <BarChart2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {loading || !queryResult
              ? "—"
              : formatMetricValue(queryResult.kpis.metricSum, queryResult.config.yField)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Computed across{" "}
            <span className="font-semibold text-slate-700 tabular-nums">
              {queryResult?.kpis.matchedRows ?? 0}
            </span>{" "}
            persisted rows
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mean / Record
            </span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {loading || !queryResult
              ? "—"
              : formatMetricValue(queryResult.kpis.metricAvg, queryResult.config.yField)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Range:{" "}
            {queryResult
              ? `${formatMetricValue(queryResult.kpis.metricMin, queryResult.config.yField)} – ${formatMetricValue(queryResult.kpis.metricMax, queryResult.config.yField)}`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Series Trajectory
            </span>
            <span className="rounded-lg bg-cyan-50 p-2 text-[#0891b2]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {loading || !queryResult
              ? "—"
              : queryResult.kpis.periodGrowthPct !== null
                ? `${queryResult.kpis.periodGrowthPct >= 0 ? "+" : ""}${queryResult.kpis.periodGrowthPct}%`
                : "N/A"}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            First-to-latest grouped {queryResult ? formatFieldLabel(queryResult.config.xField) : "period"} delta
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Leading Segment
            </span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 truncate text-xl font-bold tracking-tight text-slate-900">
            {loading || !queryResult ? "—" : queryResult.kpis.topSegment || "N/A"}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {queryResult
              ? `${formatMetricValue(queryResult.kpis.topSegmentValue, queryResult.config.yField)} (${queryResult.topSegments[0]?.sharePct ?? 0}% share)`
              : "—"}
          </p>
        </div>
      </div>

      {/* Main Analytical Workspace Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Primary Interactive Chart + Forecasting Demonstration */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold text-slate-900">
                  {activeDataset?.name || "Loading dataset..."}
                </h2>
                {activeDataset && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      activeDataset.sourceType === "sample"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-cyan-50 text-[#0891b2]"
                    }`}
                  >
                    {activeDataset.sourceType === "sample" ? "Fictional Demo Data" : "Uploaded CSV"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeDataset?.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {numericColumns.length > 0 && (
                <select
                  aria-label="Metric field"
                  value={yField}
                  onChange={(e) => {
                    const nextY = e.target.value;
                    setYField(nextY);
                    void runDatasetQuery(activeDatasetId, {
                      chartType,
                      yField: nextY,
                      showForecast,
                    });
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#06b6d4]"
                >
                  {numericColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {formatFieldLabel(col.name)}
                    </option>
                  ))}
                </select>
              )}

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["area", "bar", "line"] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setChartType(type);
                      void runDatasetQuery(activeDatasetId, {
                        chartType: type,
                        yField,
                        showForecast,
                      });
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                      chartType === type
                        ? "bg-[#111827] text-[#22d3ee]"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextForecast = !showForecast;
                  setShowForecast(nextForecast);
                  void runDatasetQuery(activeDatasetId, {
                    chartType,
                    yField,
                    showForecast: nextForecast,
                  });
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  showForecast
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-300"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                }`}
              >
                <LineChartIcon className="h-3.5 w-3.5" />
                <span>3P Forecast</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            {querying && !queryResult ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                Computing series from PostgreSQL...
              </div>
            ) : (
              <AnalyticsChart
                series={queryResult?.series || []}
                chartType={chartType}
                yField={queryResult?.config.yField || yField}
                showForecast={showForecast}
                height={320}
              />
            )}
          </div>

          {/* Transparent Forecasting Methodology Bar */}
          {queryResult && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0891b2]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Linear Regression Forecasting Methodology
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {queryResult.forecast.methodology}
                    </p>
                  </div>
                </div>
                {queryResult.forecast.enabled && queryResult.forecast.available && (
                  <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                    {queryResult.forecast.projectedPoints.map((pt) => (
                      <span
                        key={pt.label}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 tabular-nums"
                      >
                        {pt.label}: {formatMetricValue(pt.value, queryResult.config.yField)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Top Segments + Quick Saved Dashboards */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Top Segments Breakdown</h2>
              <span className="text-[11px] font-medium text-slate-500">Real DB Aggregation</span>
            </div>
            <div className="space-y-3">
              {(queryResult?.topSegments || []).map((seg, idx) => (
                <div key={seg.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-slate-800">
                      {idx + 1}. {seg.label}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {formatMetricValue(seg.value, queryResult?.config.yField)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0891b2] to-[#06b6d4]"
                      style={{ width: `${Math.max(4, Math.min(100, seg.sharePct))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                    <span>{seg.count} rows</span>
                    <span>{seg.sharePct}% share</span>
                  </div>
                </div>
              ))}
              {!loading && (queryResult?.topSegments || []).length === 0 && (
                <p className="text-xs text-slate-500">No segment breakdown available.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Saved Dashboards</h2>
              <Link
                href="/dashboards"
                className="text-xs font-semibold text-[#0891b2] hover:text-[#06b6d4]"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {dashboards.slice(0, 4).map((dash) => (
                <Link
                  key={dash.id}
                  href={`/explorer?dashboardId=${dash.id}`}
                  className="group flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-[#06b6d4]/50 hover:bg-cyan-50/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-[#0891b2]">
                      {dash.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {dash.config.aggregation.toUpperCase()}({formatFieldLabel(dash.config.yField)}) ·{" "}
                      {dash.config.chartType}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0891b2]" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Row: Activity Feed & Quick Links */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#0891b2]" />
            <h2 className="text-sm font-bold text-slate-900">Recent Analytics Activity</h2>
          </div>
          <Link
            href="/dashboards"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0891b2] hover:underline"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Executive Reports</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {activities.slice(0, 6).map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#06b6d4]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800">{act.summary}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  {act.action} · {new Date(act.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
