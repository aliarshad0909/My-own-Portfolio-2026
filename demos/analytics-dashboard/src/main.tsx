import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BarBreakdown, RevenueChart, Sparkline } from "./components/charts.tsx";
import { DATA_END, DATA_START, buildDataset } from "./data/generate.ts";
import {
  bucketOf, dayCount, delta, filterOrders, groupBy, previousPeriod, productPerformance,
  sortRows, summarise, timeSeries, toCSV, type SortKey,
} from "./lib/analytics.ts";
import { money, number, percent, shortDate } from "./lib/format.ts";
import type { DateRange, Granularity } from "./lib/types.ts";
import "./styles.css";

const { products, orders } = buildDataset();
const CHANNELS = ["Direct", "Marketplace", "Wholesale", "Retail partner", "Subscription"];

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const PRESETS: { label: string; days: number | "all" }[] = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
  { label: "All time", days: "all" },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Kpi({ label, value, change, spark, hint }: { label: string; value: string; change: number | null; spark?: number[]; hint?: string }) {
  const tone = change === null ? "flat" : change > 0 ? "up" : change < 0 ? "down" : "flat";
  return (
    <div className="kpi">
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      <p className={`kpi__delta kpi__delta--${tone}`}>
        <span aria-hidden="true">{tone === "up" ? "▲" : tone === "down" ? "▼" : "—"}</span> {percent(change)}
        <span className="kpi__vs"> vs previous period</span>
      </p>
      {hint ? <p className="kpi__hint">{hint}</p> : null}
      {spark ? <Sparkline values={spark} /> : null}
    </div>
  );
}

function App() {
  const [preset, setPreset] = useState<number | "all" | "custom">(90);
  const [custom, setCustom] = useState<DateRange>({ from: addDays(DATA_END, -89), to: DATA_END });
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [channels, setChannels] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "revenue", dir: "desc" });

  const range: DateRange = useMemo(() => {
    if (preset === "custom") return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
    if (preset === "all") return { from: DATA_START, to: DATA_END };
    return { from: addDays(DATA_END, -(preset - 1)), to: DATA_END };
  }, [preset, custom]);

  const view = useMemo(() => {
    const current = filterOrders(orders, range, channels);
    const prevRange = previousPeriod(range);
    const previous = filterOrders(orders, prevRange, channels);
    const now = summarise(current, products);
    const before = summarise(previous, products);
    const days = dayCount(range);
    const series = timeSeries(current, range, granularity);
    return {
      current, now, before, days, series, prevRange,
      byChannel: groupBy(current, "channel"),
      byRegion: groupBy(current, "region"),
      rows: productPerformance(current, products, days),
    };
  }, [range, channels, granularity]);

  const { now, before, series, rows } = view;
  const aov = now.orders === 0 ? 0 : Math.round(now.revenue / now.orders);
  const prevAov = before.orders === 0 ? 0 : Math.round(before.revenue / before.orders);
  const margin = now.revenue === 0 ? 0 : Math.round((now.grossProfit / now.revenue) * 1000) / 10;
  const sorted = sortRows(rows, sort.key, sort.dir);
  const lowCover = rows.filter((r) => r.daysOfCover !== null && r.daysOfCover < 30).length;

  const header = (key: SortKey, label: string, numeric = true) => (
    <th scope="col" className={numeric ? "num" : undefined} aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))}>
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}</span>
      </button>
    </th>
  );

  const exportCSV = () => {
    const csv = toCSV(
      ["Product", "Category", "Units", "Revenue (USD)", "Gross profit (USD)", "Margin %", "On hand", "Days of cover"],
      sorted.map((r) => [r.name, r.category, r.units, (r.revenue / 100).toFixed(2), (r.grossProfit / 100).toFixed(2), r.margin, r.onHand, r.daysOfCover ?? ""]),
    );
    download(`northwind-products-${range.from}-to-${range.to}.csv`, csv);
  };

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration dashboard.</strong> Northwind Supply Co. is a fictional business and every figure below is synthetic data generated for this demo.
      </p>

      <header className="top">
        <div className="top__brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <h1>Northwind Supply Co.</h1>
            <p>Commercial performance</p>
          </div>
        </div>
        <div className="top__meta">
          <span>
            {shortDate(range.from)} – {shortDate(range.to)}
          </span>
          <span>{view.days} days</span>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="controls" aria-label="Filters">
          <div className="control">
            <span className="control__label" id="range-label">Date range</span>
            <div className="chips" role="group" aria-labelledby="range-label">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className={`chip ${preset === p.days ? "is-on" : ""}`} aria-pressed={preset === p.days} onClick={() => setPreset(p.days)}>
                  {p.label}
                </button>
              ))}
              <button type="button" className={`chip ${preset === "custom" ? "is-on" : ""}`} aria-pressed={preset === "custom"} onClick={() => setPreset("custom")}>
                Custom
              </button>
            </div>
          </div>

          {preset === "custom" ? (
            <div className="control control--dates">
              <label>
                <span className="control__label">From</span>
                <input type="date" value={custom.from} min={DATA_START} max={DATA_END} onChange={(e: { target: { value: string } }) => setCustom((c) => ({ ...c, from: e.target.value }))} />
              </label>
              <label>
                <span className="control__label">To</span>
                <input type="date" value={custom.to} min={DATA_START} max={DATA_END} onChange={(e: { target: { value: string } }) => setCustom((c) => ({ ...c, to: e.target.value }))} />
              </label>
            </div>
          ) : null}

          <div className="control">
            <span className="control__label" id="ch-label">Channel</span>
            <div className="chips" role="group" aria-labelledby="ch-label">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip ${channels.includes(c) ? "is-on" : ""}`}
                  aria-pressed={channels.includes(c)}
                  onClick={() => setChannels((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
                >
                  {c}
                </button>
              ))}
              {channels.length > 0 ? (
                <button type="button" className="chip chip--clear" onClick={() => setChannels([])}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <p className="visually-hidden" role="status" aria-live="polite">
          Showing {number(now.orders)} orders between {range.from} and {range.to}.
        </p>

        <section className="kpis" aria-label="Key metrics">
          <Kpi label="Revenue" value={money(now.revenue, true)} change={delta(now.revenue, before.revenue)} spark={series.map((p) => p.revenue)} />
          <Kpi label="Orders" value={number(now.orders)} change={delta(now.orders, before.orders)} spark={series.map((p) => p.orders)} />
          <Kpi label="Average order value" value={money(aov)} change={delta(aov, prevAov)} />
          <Kpi label="Units sold" value={number(now.units)} change={delta(now.units, before.units)} spark={series.map((p) => p.units)} />
          <Kpi label="Gross profit" value={money(now.grossProfit, true)} change={delta(now.grossProfit, before.grossProfit)} hint={`${margin}% margin`} />
          <Kpi label="New customers" value={number(now.newCustomers)} change={delta(now.newCustomers, before.newCustomers)} hint={`${number(now.customers)} active in period`} />
        </section>

        <section className="panel panel--wide" aria-labelledby="rev-title">
          <div className="panel__head">
            <h2 id="rev-title">Revenue over time</h2>
            <div className="chips" role="group" aria-label="Granularity">
              {(["day", "week", "month"] as Granularity[]).map((g) => (
                <button key={g} type="button" className={`chip ${granularity === g ? "is-on" : ""}`} aria-pressed={granularity === g} onClick={() => setGranularity(g)}>
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart points={series} granularity={granularity} />
        </section>

        <div className="split">
          <section className="panel" aria-labelledby="ch-title">
            <div className="panel__head">
              <h2 id="ch-title">Revenue by channel</h2>
            </div>
            <BarBreakdown rows={view.byChannel} title="Revenue by channel" />
          </section>
          <section className="panel" aria-labelledby="rg-title">
            <div className="panel__head">
              <h2 id="rg-title">Revenue by region</h2>
            </div>
            <BarBreakdown rows={view.byRegion} title="Revenue by region" />
          </section>
        </div>

        <section className="panel panel--wide" aria-labelledby="prod-title">
          <div className="panel__head">
            <div>
              <h2 id="prod-title">Product performance</h2>
              <p className="panel__sub">
                {rows.length} products · {lowCover} with under 30 days of stock cover at the current rate
              </p>
            </div>
            <button type="button" className="btn" onClick={exportCSV}>
              Export CSV
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Product performance for the selected period</caption>
              <thead>
                <tr>
                  {header("name", "Product", false)}
                  {header("units", "Units")}
                  {header("revenue", "Revenue")}
                  {header("grossProfit", "Gross profit")}
                  {header("margin", "Margin")}
                  {header("onHand", "On hand")}
                  {header("daysOfCover", "Days of cover")}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      {r.name}
                      <small>{r.category}</small>
                    </th>
                    <td className="num">{number(r.units)}</td>
                    <td className="num">{money(r.revenue)}</td>
                    <td className="num">{money(r.grossProfit)}</td>
                    <td className="num">{r.margin}%</td>
                    <td className="num">{number(r.onHand)}</td>
                    <td className="num">
                      {r.daysOfCover === null ? (
                        <span className="muted">no sales</span>
                      ) : (
                        <span className={r.daysOfCover < 30 ? "flag flag--low" : r.daysOfCover > 240 ? "flag flag--high" : ""}>{r.daysOfCover}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>
          Synthetic dataset: {number(orders.length)} order lines across {products.length} products, {DATA_START} to {DATA_END}. Generated deterministically in the browser — no server, no tracking, no real customer data.
        </p>
        <p>Built by Ali Arshad as a portfolio demonstration.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
