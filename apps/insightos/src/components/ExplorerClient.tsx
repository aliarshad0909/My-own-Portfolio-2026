"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  CheckCircle2,
  Download,
  Filter,
  Info,
  LineChart as LineChartIcon,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import {
  ExplorerRequestTracker,
  isAbortError,
  isExplorerActionReady,
} from "@/lib/explorer-state";
import { formatCategoryBadge, formatFieldLabel, formatMetricValue } from "@/lib/format";
import type {
  AggregationType,
  AnalyticsQueryResult,
  ChartType,
  ColumnMeta,
  DashboardConfig,
  DatasetSummary,
} from "@/lib/types";

type ExplorerClientProps = {
  initialDatasetId: string;
  initialDashboardId: string;
};

export function ExplorerClient({
  initialDatasetId,
  initialDashboardId,
}: ExplorerClientProps) {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [datasetId, setDatasetId] = useState<string>(initialDatasetId);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [config, setConfig] = useState<DashboardConfig>({
    chartType: "area",
    xField: "",
    yField: "",
    aggregation: "sum",
    filterField: null,
    filterValue: null,
    dateField: null,
    dateFrom: null,
    dateTo: null,
    showForecast: true,
  });
  const [result, setResult] = useState<AnalyticsQueryResult | null>(null);
  const [loadedDatasetId, setLoadedDatasetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);

  // Monotonic request sequencing + AbortController lifecycle for stale-response gating
  const requestTrackerRef = useRef<ExplorerRequestTracker | null>(null);
  const selectedDatasetIdRef = useRef<string>(initialDatasetId);

  const getRequestTracker = useCallback(() => {
    if (!requestTrackerRef.current) {
      requestTrackerRef.current = new ExplorerRequestTracker();
    }
    return requestTrackerRef.current;
  }, []);

  // Save Dashboard state
  const [dashName, setDashName] = useState("");
  const [dashDesc, setDashDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const runQuery = useCallback(
    async (targetDatasetId: string, partialConfig?: Partial<DashboardConfig>) => {
      if (!targetDatasetId) return;
      selectedDatasetIdRef.current = targetDatasetId;
      const tracker = getRequestTracker();
      const ticket = tracker.begin(targetDatasetId);
      setQuerying(true);
      try {
        const res = await fetch("/api/analytics/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ticket.signal,
          body: JSON.stringify({
            datasetId: targetDatasetId,
            ...partialConfig,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const responseDatasetId: string = data?.result?.datasetId ?? "";
        if (!tracker.shouldApplyResponse(ticket, responseDatasetId, selectedDatasetIdRef.current)) {
          return;
        }
        setResult(data.result);
        setColumns(data.columns || []);
        setConfig(data.result.config);
        setLoadedDatasetId(responseDatasetId);
      } catch (err) {
        if (isAbortError(err)) return;
      } finally {
        if (tracker.isLatest(ticket.seq)) {
          setQuerying(false);
        }
      }
    },
    [getRequestTracker],
  );

  const bootstrap = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      try {
        const dsRes = await fetch("/api/datasets", { signal });
        if (!dsRes.ok || signal.aborted) return;
        const dsData = await dsRes.json();
        if (signal.aborted) return;
        const list: DatasetSummary[] = dsData.datasets || [];
        setDatasets(list);

        if (initialDashboardId) {
          const dashRes = await fetch(`/api/dashboards/${initialDashboardId}`, { signal });
          if (dashRes.ok && !signal.aborted) {
            const dashData = await dashRes.json();
            if (signal.aborted) return;
            const dashDatasetId: string = dashData.dashboard.datasetId;
            selectedDatasetIdRef.current = dashDatasetId;
            getRequestTracker().commitExternal(dashDatasetId);
            setDatasetId(dashDatasetId);
            setLoadedDatasetId(dashData.analytics.datasetId ?? dashDatasetId);
            setResult(dashData.analytics);
            setColumns(dashData.columns || []);
            setConfig(dashData.analytics.config);
            setDashName(`${dashData.dashboard.name} (Copy)`);
            setDashDesc(dashData.dashboard.description || "");
            return;
          }
        }

        const chosenId =
          (initialDatasetId && list.some((d) => d.id === initialDatasetId) ? initialDatasetId : "") ||
          list.find((d) => d.slug === "sales-regional-2026")?.id ||
          list[0]?.id ||
          "";

        if (chosenId && !signal.aborted) {
          selectedDatasetIdRef.current = chosenId;
          setDatasetId(chosenId);
          setLoadedDatasetId(null);
          await runQuery(chosenId);
        }
      } catch (err) {
        if (isAbortError(err)) return;
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [getRequestTracker, initialDashboardId, initialDatasetId, runQuery],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void bootstrap(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      requestTrackerRef.current?.abort();
    };
  }, [bootstrap]);

  function updateConfig(patch: Partial<DashboardConfig>) {
    if (!datasetId || loadedDatasetId !== datasetId) return;
    const merged: DashboardConfig = { ...config, ...patch };
    setConfig(merged);
    void runQuery(datasetId, merged);
  }

  const canCommitActions = isExplorerActionReady({
    loading,
    querying,
    datasetId,
    loadedDatasetId,
    resultDatasetId: result?.datasetId ?? null,
  });

  async function handleSaveDashboard(e: React.FormEvent) {
    e.preventDefault();
    if (!canCommitActions || !dashName.trim()) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dashName.trim(),
          datasetId,
          description: dashDesc.trim(),
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage({ type: "err", text: data.error || "Could not save dashboard." });
        return;
      }
      setSaveMessage({
        type: "ok",
        text: `Saved "${data.dashboard.name}" to PostgreSQL.`,
      });
      setDashName("");
      setDashDesc("");
    } catch {
      setSaveMessage({ type: "err", text: "Network error saving dashboard." });
    } finally {
      setSaving(false);
    }
  }

  const numericColumns = columns.filter((c) => c.type === "number");
  const stringColumns = columns.filter((c) => c.type === "string");
  const filterValues = config.filterField ? result?.filterOptions[config.filterField] || [] : [];

  const exportUrl = (() => {
    if (!canCommitActions) return "#";
    const qs = new URLSearchParams();
    if (config.filterField && config.filterValue) {
      qs.set("filterField", config.filterField);
      qs.set("filterValue", config.filterValue);
    }
    if (config.dateField) qs.set("dateField", config.dateField);
    if (config.dateFrom) qs.set("dateFrom", config.dateFrom);
    if (config.dateTo) qs.set("dateTo", config.dateTo);
    const suffix = qs.toString();
    return `/api/datasets/${datasetId}/export${suffix ? `?${suffix}` : ""}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Interactive Chart Explorer &amp; Dashboard Builder
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Slice any seeded or uploaded PostgreSQL dataset by dimension, aggregation, category, and date range — then save reusable dashboards.
          </p>
        </div>
        {datasetId &&
          (canCommitActions ? (
            <a
              href={exportUrl}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#06b6d4] hover:text-[#0891b2]"
            >
              <Download className="h-3.5 w-3.5 text-[#0891b2]" />
              <span>Export Filtered CSV</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-400 opacity-60 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export Filtered CSV</span>
            </button>
          ))}
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Query Builder Panel */}
        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#0891b2]" />
              <h2 className="text-sm font-bold text-slate-900">Query Configuration</h2>
            </div>
            <button
              type="button"
              disabled={!canCommitActions}
              onClick={() => {
                if (canCommitActions) {
                  void runQuery(datasetId, { filterValue: null, dateFrom: null, dateTo: null });
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#0891b2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Data Source</label>
              <select
                value={datasetId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  selectedDatasetIdRef.current = nextId;
                  setDatasetId(nextId);
                  setLoadedDatasetId(null);
                  setResult(null);
                  setColumns([]);
                  setSaveMessage(null);
                  void runQuery(nextId);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#06b6d4]"
              >
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({formatCategoryBadge(ds.category)} · {ds.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">X-Axis (Group By)</label>
                <select
                  value={config.xField}
                  onChange={(e) => updateConfig({ xField: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
                >
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {formatFieldLabel(c.name)} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Y-Axis Metric</label>
                <select
                  value={config.yField}
                  onChange={(e) => updateConfig({ yField: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
                >
                  {(numericColumns.length > 0 ? numericColumns : columns).map((c) => (
                    <option key={c.name} value={c.name}>
                      {formatFieldLabel(c.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Aggregation</label>
                <select
                  value={config.aggregation}
                  onChange={(e) => updateConfig({ aggregation: e.target.value as AggregationType })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
                >
                  <option value="sum">SUM</option>
                  <option value="avg">AVG (Mean)</option>
                  <option value="count">COUNT (Rows)</option>
                  <option value="max">MAX</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Chart Type</label>
                <div className="grid grid-cols-3 rounded-lg border border-slate-300 bg-slate-50 p-0.5">
                  {(["bar", "line", "area"] as ChartType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateConfig({ chartType: t })}
                      className={`rounded-md py-1.5 text-xs font-semibold capitalize transition ${
                        config.chartType === t
                          ? "bg-[#111827] text-[#22d3ee]"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Filter className="h-3.5 w-3.5 text-[#0891b2]" />
                <span>Category &amp; Date-Range Filters</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Category Column
                  </label>
                  <select
                    value={config.filterField || ""}
                    onChange={(e) =>
                      updateConfig({ filterField: e.target.value || null, filterValue: null })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#06b6d4]"
                  >
                    <option value="">None</option>
                    {stringColumns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {formatFieldLabel(c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    Segment Value
                  </label>
                  <select
                    value={config.filterValue || ""}
                    disabled={!config.filterField}
                    onChange={(e) => updateConfig({ filterValue: e.target.value || null })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#06b6d4] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">All Segments</option>
                    {filterValues.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {result?.dateBounds.field && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Date From ({result.dateBounds.field})
                    </label>
                    <input
                      type="date"
                      value={config.dateFrom || ""}
                      min={result.dateBounds.min || undefined}
                      max={result.dateBounds.max || undefined}
                      onChange={(e) => updateConfig({ dateFrom: e.target.value || null })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#06b6d4]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Date To ({result.dateBounds.field})
                    </label>
                    <input
                      type="date"
                      value={config.dateTo || ""}
                      min={result.dateBounds.min || undefined}
                      max={result.dateBounds.max || undefined}
                      onChange={(e) => updateConfig({ dateTo: e.target.value || null })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#06b6d4]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Linear Forecast Toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-amber-700" />
                <div>
                  <p className="text-xs font-semibold text-amber-950">3-Period Linear Forecast</p>
                  <p className="text-[11px] text-amber-800/80">Fit OLS regression to observed series</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(config.showForecast)}
                onChange={(e) => updateConfig({ showForecast: e.target.checked })}
                className="h-4 w-4 accent-[#0891b2]"
              />
            </label>
          </div>

          {/* Save Dashboard Form */}
          <form onSubmit={handleSaveDashboard} className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-[#0891b2]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Save Dashboard to PostgreSQL
              </h3>
            </div>
            <input
              type="text"
              required
              value={dashName}
              onChange={(e) => setDashName(e.target.value)}
              placeholder="Dashboard title (e.g. APAC Quarterly Sales)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
            />
            <input
              type="text"
              value={dashDesc}
              onChange={(e) => setDashDesc(e.target.value)}
              placeholder="Executive note / description (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#06b6d4]"
            />
            <button
              type="submit"
              disabled={saving || !dashName.trim() || !canCommitActions}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0891b2] disabled:opacity-50"
            >
              <BookmarkPlus className="h-4 w-4 text-[#22d3ee]" />
              <span>{saving ? "Saving..." : "Save Dashboard"}</span>
            </button>

            {saveMessage && (
              <div
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  saveMessage.type === "ok"
                    ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    {saveMessage.type === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-[#0891b2]" />}
                    {saveMessage.text}
                  </span>
                  {saveMessage.type === "ok" && (
                    <Link href="/dashboards" className="font-bold underline">
                      View
                    </Link>
                  )}
                </div>
              </div>
            )}
          </form>
        </aside>

        {/* Right Visualization & Diagnostics */}
        <div className="space-y-5 xl:col-span-8">
          {/* Live KPI Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Matched Rows</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums">
                {result ? `${result.kpis.matchedRows} / ${result.kpis.totalRows}` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Total Sum</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums">
                {result ? formatMetricValue(result.kpis.metricSum, config.yField) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Mean Value</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums">
                {result ? formatMetricValue(result.kpis.metricAvg, config.yField) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Peak Record</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums">
                {result ? formatMetricValue(result.kpis.metricMax, config.yField) : "—"}
              </p>
            </div>
          </div>

          {/* Interactive Chart Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {config.aggregation.toUpperCase()}({formatFieldLabel(config.yField || "metric")}) by{" "}
                  {formatFieldLabel(config.xField || "dimension")}
                </h2>
                <p className="text-xs text-slate-500">
                  {result?.datasetName || "Select a dataset"}
                  {config.filterValue ? ` · Filtered: ${config.filterField} = ${config.filterValue}` : ""}
                  {config.dateFrom || config.dateTo
                    ? ` · Dates: ${config.dateFrom || "start"} to ${config.dateTo || "latest"}`
                    : ""}
                </p>
              </div>
              {querying && (
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-[#0891b2]">
                  Updating...
                </span>
              )}
            </div>

            {loading || (querying && !result) ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-slate-400">
                {loading ? "Loading Explorer..." : "Loading dataset..."}
              </div>
            ) : (
              <AnalyticsChart
                series={result?.series || []}
                chartType={config.chartType}
                yField={config.yField}
                showForecast={Boolean(config.showForecast)}
                height={360}
              />
            )}

            {result && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0891b2]" />
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-800">
                      Statistical Forecast Diagnostics
                    </p>
                    <p>{result.forecast.methodology}</p>
                    {result.forecast.enabled && result.forecast.available && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {result.forecast.projectedPoints.map((pt) => (
                          <span
                            key={pt.label}
                            className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-900 tabular-nums"
                          >
                            {pt.label}: {formatMetricValue(pt.value, config.yField)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
