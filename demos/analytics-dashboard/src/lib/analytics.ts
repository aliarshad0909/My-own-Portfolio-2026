import type { DateRange, Granularity, Metric, Order, Product } from "./types.ts";

export const inRange = (date: string, r: DateRange) => date >= r.from && date <= r.to;

export const filterOrders = (orders: Order[], r: DateRange, channels: string[]) =>
  orders.filter((o) => inRange(o.date, r) && (channels.length === 0 || channels.includes(o.channel)));

export function summarise(orders: Order[], products: Product[]): Metric {
  const byId = new Map(products.map((p) => [p.id, p]));
  let revenue = 0, units = 0, newCustomers = 0, cost = 0;
  const customers = new Set<string>();
  for (const o of orders) {
    revenue += o.revenue;
    units += o.units;
    customers.add(o.customerId);
    if (o.isNewCustomer) newCustomers++;
    const p = byId.get(o.productId);
    if (p) cost += p.unitCost * o.units;
  }
  return { revenue, orders: orders.length, units, customers: customers.size, newCustomers, grossProfit: revenue - cost };
}

/** Percentage change, rounded to one decimal. Null when there is no base to compare against. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const dayCount = (r: DateRange) =>
  Math.round((Date.parse(`${r.to}T00:00:00Z`) - Date.parse(`${r.from}T00:00:00Z`)) / 86400000) + 1;

/** The equally long window immediately before `r`, for period-on-period comparison. */
export function previousPeriod(r: DateRange): DateRange {
  const len = dayCount(r);
  return { from: addDays(r.from, -len), to: addDays(r.from, -1) };
}

/** ISO week starting Monday. */
function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

export const bucketOf = (date: string, g: Granularity) =>
  g === "day" ? date : g === "week" ? weekStart(date) : `${date.slice(0, 7)}-01`;

export type Point = { bucket: string; revenue: number; orders: number; units: number };

/** Group orders into time buckets. Empty buckets inside the range are kept, so lines never lie about gaps. */
export function timeSeries(orders: Order[], range: DateRange, g: Granularity): Point[] {
  const map = new Map<string, Point>();
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) {
    const b = bucketOf(d, g);
    if (!map.has(b)) map.set(b, { bucket: b, revenue: 0, orders: 0, units: 0 });
  }
  for (const o of orders) {
    const p = map.get(bucketOf(o.date, g));
    if (!p) continue;
    p.revenue += o.revenue;
    p.orders += 1;
    p.units += o.units;
  }
  return [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
}

export type Breakdown = { key: string; revenue: number; orders: number; units: number; share: number };

export function groupBy(orders: Order[], key: "channel" | "region"): Breakdown[] {
  const map = new Map<string, Breakdown>();
  let total = 0;
  for (const o of orders) {
    const k = o[key];
    const row = map.get(k) ?? { key: k, revenue: 0, orders: 0, units: 0, share: 0 };
    row.revenue += o.revenue;
    row.orders += 1;
    row.units += o.units;
    map.set(k, row);
    total += o.revenue;
  }
  return [...map.values()]
    .map((r) => ({ ...r, share: total === 0 ? 0 : Math.round((r.revenue / total) * 1000) / 10 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
  grossProfit: number;
  margin: number;
  onHand: number;
  /** Days of stock left at the current sales rate; null when nothing sold. */
  daysOfCover: number | null;
};

export function productPerformance(orders: Order[], products: Product[], days: number): ProductRow[] {
  const agg = new Map<string, { units: number; revenue: number }>();
  for (const o of orders) {
    const a = agg.get(o.productId) ?? { units: 0, revenue: 0 };
    a.units += o.units;
    a.revenue += o.revenue;
    agg.set(o.productId, a);
  }
  return products
    .map((p) => {
      const a = agg.get(p.id) ?? { units: 0, revenue: 0 };
      const grossProfit = a.revenue - p.unitCost * a.units;
      const perDay = days > 0 ? a.units / days : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        units: a.units,
        revenue: a.revenue,
        grossProfit,
        margin: a.revenue === 0 ? 0 : Math.round((grossProfit / a.revenue) * 1000) / 10,
        onHand: p.onHand,
        daysOfCover: perDay > 0 ? Math.round(p.onHand / perDay) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export type SortKey = keyof Pick<ProductRow, "name" | "units" | "revenue" | "grossProfit" | "margin" | "onHand" | "daysOfCover">;

export function sortRows(rows: ProductRow[], key: SortKey, dir: "asc" | "desc"): ProductRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x === null) return 1;
    if (y === null) return -1;
    if (typeof x === "string" && typeof y === "string") return sign * x.localeCompare(y);
    return sign * ((x as number) - (y as number));
  });
}

/** RFC 4180 CSV: quotes doubled, fields with commas, quotes or newlines wrapped. */
export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
