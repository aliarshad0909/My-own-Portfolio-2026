import { balances } from "./ledger.ts";
import type { Item, Movement, PurchaseOrder, Supplier } from "./types.ts";

/** Units issued to production per day over the window, used for cover and ABC. */
export function consumptionRate(movements: Movement[], sku: string, days: number, today: string): number {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - days);
  const cutoff = from.toISOString();
  const issued = movements
    .filter((m) => m.sku === sku && m.type === "issue" && m.at >= cutoff)
    .reduce((s, m) => s + Math.abs(m.qty), 0);
  return days > 0 ? issued / days : 0;
}

export type StockRow = {
  item: Item;
  main: number;
  west: number;
  total: number;
  /** Outstanding quantity on open purchase orders. */
  onOrder: number;
  value: number;
  perDay: number;
  /** Days until stock-out at the current rate; null when nothing is moving. */
  daysCover: number | null;
  /** Stock alone is at or below the reorder point. */
  belowReorder: boolean;
  /** Below the reorder point AND not already covered by an open order. */
  needsOrder: boolean;
};

/** Outstanding quantity per SKU across open purchase orders. */
export function onOrderBySku(orders: PurchaseOrder[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const po of orders) {
    if (po.status !== "sent" && po.status !== "partial") continue;
    for (const l of po.lines) map.set(l.sku, (map.get(l.sku) ?? 0) + Math.max(0, l.qtyOrdered - l.qtyReceived));
  }
  return map;
}

export function stockReport(items: Item[], movements: Movement[], today: string, orders: PurchaseOrder[] = [], windowDays = 90): StockRow[] {
  const bal = balances(movements);
  const onOrder = onOrderBySku(orders);
  return items.map((item) => {
    const main = bal.get(`${item.sku}|MAIN`) ?? 0;
    const west = bal.get(`${item.sku}|WEST`) ?? 0;
    const total = main + west;
    const perDay = consumptionRate(movements, item.sku, windowDays, today);
    const ordered = onOrder.get(item.sku) ?? 0;
    return {
      item,
      main,
      west,
      total,
      onOrder: ordered,
      value: total * item.unitCost,
      perDay,
      daysCover: perDay > 0 ? Math.round(total / perDay) : null,
      belowReorder: total <= item.reorderPoint,
      needsOrder: total + ordered <= item.reorderPoint,
    };
  });
}

/** ABC analysis by annualised consumption value: A = top 80%, B = next 15%, C = rest. */
export function abcAnalysis(rows: StockRow[]): Map<string, "A" | "B" | "C"> {
  const scored = rows
    .map((r) => ({ sku: r.item.sku, annual: r.perDay * 365 * r.item.unitCost }))
    .sort((a, b) => b.annual - a.annual);
  const total = scored.reduce((s, r) => s + r.annual, 0);
  const out = new Map<string, "A" | "B" | "C">();
  let cumulative = 0;
  for (const r of scored) {
    cumulative += r.annual;
    const share = total === 0 ? 1 : cumulative / total;
    out.set(r.sku, share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C");
  }
  return out;
}

export type SupplierRow = {
  supplier: Supplier;
  openOrders: number;
  openValue: number;
  skus: number;
  /** Open orders whose expected date has passed. */
  overdue: number;
};

export function supplierReport(suppliers: Supplier[], items: Item[], orders: PurchaseOrder[], today: string): SupplierRow[] {
  return suppliers.map((supplier) => {
    const open = orders.filter((o) => o.supplierId === supplier.id && (o.status === "sent" || o.status === "partial"));
    return {
      supplier,
      openOrders: open.length,
      openValue: open.reduce((s, o) => s + o.lines.reduce((t, l) => t + (l.qtyOrdered - l.qtyReceived) * l.unitPrice, 0), 0),
      skus: items.filter((i) => i.supplierId === supplier.id).length,
      overdue: open.filter((o) => o.expectedAt < today).length,
    };
  });
}

export function movementSummary(movements: Movement[], days: number, today: string) {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - days);
  const cutoff = from.toISOString();
  const recent = movements.filter((m) => m.at >= cutoff);
  const by = (type: string) => recent.filter((m) => m.type === type);
  return {
    receipts: by("receipt").reduce((s, m) => s + m.qty, 0),
    issues: Math.abs(by("issue").reduce((s, m) => s + m.qty, 0)),
    adjustments: by("adjustment").reduce((s, m) => s + m.qty, 0),
    adjustmentCount: by("adjustment").length,
    transfers: by("transfer_out").length,
    total: recent.length,
  };
}
