"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatFieldLabel, formatMetricValue } from "@/lib/format";
import type { ChartType, SeriesPoint } from "@/lib/types";

type AnalyticsChartProps = {
  series: SeriesPoint[];
  chartType: ChartType;
  yField: string;
  showForecast?: boolean;
  height?: number;
};

type ChartDatum = {
  label: string;
  observed: number | null;
  forecast: number | null;
  isForecast: boolean;
  count: number;
};

export function AnalyticsChart({
  series,
  chartType,
  yField,
  showForecast = false,
  height = 320,
}: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-sm text-slate-500"
        style={{ height }}
      >
        No matching records for the current filter selection.
      </div>
    );
  }

  const data: ChartDatum[] = series.map((pt) => ({
    label: pt.label,
    observed: pt.isForecast ? null : pt.value,
    forecast: pt.forecastValue ?? (pt.isForecast ? pt.value : null),
    isForecast: Boolean(pt.isForecast),
    count: pt.count,
  }));

  const metricLabel = formatFieldLabel(yField);
  const hasForecastPoints = showForecast && data.some((d) => d.isForecast);

  const formatTick = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-50 text-xs font-medium text-slate-400"
        style={{ height }}
      >
        Rendering visualization...
      </div>
    );
  }

  const tooltipFormatter = (value: unknown, name: unknown) => {
    const num = typeof value === "number" ? value : Number(value ?? 0);
    const labelStr =
      name === "forecast" ? `${metricLabel} (Linear Forecast)` : `${metricLabel} (Observed)`;
    return [formatMetricValue(num, yField), labelStr];
  };

  const commonAxisProps = {
    tick: { fill: "#475569", fontSize: 12 },
    axisLine: { stroke: "#cbd5e1" },
    tickLine: false,
  };

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {chartType === "bar" ? (
          hasForecastPoints ? (
            <ComposedChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
              <YAxis {...commonAxisProps} tickFormatter={formatTick} width={56} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="observed" name="Observed" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Line
                type="monotone"
                dataKey="forecast"
                name="3-Period Linear Forecast"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: "#f59e0b", stroke: "#111827", strokeWidth: 1.5 }}
                connectNulls
              />
            </ComposedChart>
          ) : (
            <BarChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
              <YAxis {...commonAxisProps} tickFormatter={formatTick} width={56} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}
              />
              <Bar dataKey="observed" name="Observed" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry, idx) => (
                  <Cell
                    key={`${entry.label}-${idx}`}
                    fill={idx === 0 ? "#0891b2" : "#06b6d4"}
                  />
                ))}
              </Bar>
            </BarChart>
          )
        ) : chartType === "line" ? (
          <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis {...commonAxisProps} tickFormatter={formatTick} width={56} />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                color: "#f8fafc",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Line
              type="monotone"
              dataKey="observed"
              name="Observed"
              stroke="#0891b2"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#0891b2" }}
              connectNulls
            />
            {hasForecastPoints && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="3-Period Linear Forecast"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: "#f59e0b", stroke: "#111827", strokeWidth: 1.5 }}
                connectNulls
              />
            )}
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
            <defs>
              <linearGradient id="insightosCyanFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="insightosForecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis {...commonAxisProps} tickFormatter={formatTick} width={56} />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                color: "#f8fafc",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Area
              type="monotone"
              dataKey="observed"
              name="Observed"
              stroke="#0891b2"
              strokeWidth={2.5}
              fill="url(#insightosCyanFill)"
              dot={{ r: 3.5, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 1.5 }}
              connectNulls
            />
            {hasForecastPoints && (
              <Area
                type="monotone"
                dataKey="forecast"
                name="3-Period Linear Forecast"
                stroke="#f59e0b"
                strokeWidth={2.2}
                strokeDasharray="6 4"
                fill="url(#insightosForecastFill)"
                dot={{ r: 3.5, fill: "#f59e0b", stroke: "#111827", strokeWidth: 1.5 }}
                connectNulls
              />
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
