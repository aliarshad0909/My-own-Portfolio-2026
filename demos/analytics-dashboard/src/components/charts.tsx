import { useId, useState } from "react";
import { money, monthLabel, number, shortDate } from "../lib/format.ts";
import type { Breakdown, Point } from "../lib/analytics.ts";

/**
 * Charts are drawn as SVG from the data — no charting library. Each one has a
 * screen-reader table alternative, so the numbers are never locked inside a picture.
 */

const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

type LineProps = { points: Point[]; granularity: "day" | "week" | "month"; height?: number };

export function RevenueChart({ points, granularity, height = 260 }: LineProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceCeil(Math.max(1, ...points.map((p) => p.revenue)));
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(" ");
  const area = points.length > 0 ? `${path} L${x(points.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const label = (b: string) => (granularity === "month" ? monthLabel(b) : shortDate(b));
  const every = Math.max(1, Math.ceil(points.length / 7));
  const active = hover !== null ? points[hover] : null;

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart__svg"
        role="img"
        aria-label={`Revenue by ${granularity}. ${points.length} points, peak ${money(max, true)}.`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e: { currentTarget: SVGSVGElement; clientX: number }) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const i = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
          setHover(i >= 0 && i < points.length ? i : null);
        }}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={PAD.left - 10} y={y(t) + 4} className="chart__tick" textAnchor="end">
              {money(t, true)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % every === 0 ? (
            <text key={p.bucket} x={x(i)} y={H - 8} className="chart__tick" textAnchor="middle">
              {label(p.bucket)}
            </text>
          ) : null,
        )}
        {area ? <path d={area} fill={`url(#${id}-fill)`} /> : null}
        <path d={path} className="chart__line" />
        {active && hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="chart__cursor" />
            <circle cx={x(hover)} cy={y(active.revenue)} r="4.5" className="chart__dot" />
          </g>
        ) : null}
      </svg>
      {active ? (
        <figcaption className="chart__readout" role="status">
          <strong>{label(active.bucket)}</strong>
          <span>{money(active.revenue)}</span>
          <span>{number(active.orders)} orders</span>
          <span>{number(active.units)} units</span>
        </figcaption>
      ) : (
        <figcaption className="chart__readout chart__readout--idle">Hover the chart to read exact values.</figcaption>
      )}
      <table className="visually-hidden">
        <caption>Revenue by {granularity}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Revenue</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.bucket}>
              <th scope="row">{p.bucket}</th>
              <td>{money(p.revenue)}</td>
              <td>{p.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function BarBreakdown({ rows, title }: { rows: Breakdown[]; title: string }) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <div className="bars">
      <ul>
        {rows.map((r) => (
          <li key={r.key}>
            <span className="bars__label">{r.key}</span>
            <span className="bars__track">
              <span className="bars__fill" style={{ width: `${Math.max(2, (r.revenue / max) * 100)}%` }} />
            </span>
            <span className="bars__value">
              {money(r.revenue, true)} <small>{r.share}%</small>
            </span>
          </li>
        ))}
      </ul>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Revenue</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.key}</th>
              <td>{money(r.revenue)}</td>
              <td>{r.share}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sparkline used inside KPI tiles. Decorative: the tile states the numbers. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * 100).toFixed(1)},${(26 - ((v - min) / span) * 24).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="spark" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
