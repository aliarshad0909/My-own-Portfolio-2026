import { post, type PostResult } from "./ledger.ts";
import type { Item, Movement, POStatus, PurchaseOrder, Warehouse } from "./types.ts";

export const poValue = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + l.qtyOrdered * l.unitPrice, 0);
export const poOutstanding = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + Math.max(0, l.qtyOrdered - l.qtyReceived), 0);
export const poReceivedValue = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + l.qtyReceived * l.unitPrice, 0);

/** Status follows what has actually been received; it is never set by hand. */
export function deriveStatus(po: PurchaseOrder): POStatus {
  if (po.status === "draft" || po.status === "cancelled") return po.status;
  const ordered = po.lines.reduce((s, l) => s + l.qtyOrdered, 0);
  const received = po.lines.reduce((s, l) => s + l.qtyReceived, 0);
  if (received === 0) return "sent";
  return received >= ordered ? "received" : "partial";
}

export const ALLOWED: Record<POStatus, POStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["partial", "received", "cancelled"],
  partial: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

export const canTransition = (from: POStatus, to: POStatus) => ALLOWED[from].includes(to);

export type ReceiptLine = { sku: string; qty: number };

export type ReceiveResult =
  | { ok: true; po: PurchaseOrder; movements: Movement[]; received: ReceiptLine[] }
  | { ok: false; error: string };

/**
 * Receive against a purchase order.
 *
 * Over-receipt is refused: you cannot book in more than was ordered. Each
 * accepted line posts one receipt movement, so the ledger and the PO agree.
 */
export function receive(po: PurchaseOrder, movements: Movement[], lines: ReceiptLine[], at: string): ReceiveResult {
  if (po.status === "draft") return { ok: false, error: "Send the order to the supplier before receiving against it." };
  if (po.status === "cancelled") return { ok: false, error: "This order was cancelled." };
  if (po.status === "received") return { ok: false, error: "This order is already fully received." };

  const wanted = lines.filter((l) => l.qty > 0);
  if (wanted.length === 0) return { ok: false, error: "Enter a quantity to receive." };

  for (const line of wanted) {
    const poLine = po.lines.find((l) => l.sku === line.sku);
    if (!poLine) return { ok: false, error: `${line.sku} is not on this order.` };
    if (!Number.isInteger(line.qty)) return { ok: false, error: "Quantities must be whole numbers." };
    const remaining = poLine.qtyOrdered - poLine.qtyReceived;
    if (line.qty > remaining) return { ok: false, error: `${line.sku}: ${remaining} still outstanding, cannot receive ${line.qty}.` };
  }

  let ledger = movements;
  for (const line of wanted) {
    const result = post(ledger, { at, sku: line.sku, warehouse: po.warehouse, type: "receipt", qty: line.qty, reference: po.id, note: `Goods receipt` });
    if (!result.ok) return { ok: false, error: result.error };
    ledger = result.movements;
  }

  const updated: PurchaseOrder = {
    ...po,
    lines: po.lines.map((l) => {
      const got = wanted.find((w) => w.sku === l.sku);
      return got ? { ...l, qtyReceived: l.qtyReceived + got.qty } : l;
    }),
  };
  return { ok: true, po: { ...updated, status: deriveStatus(updated) }, movements: ledger, received: wanted };
}

export type SuggestedOrder = { sku: string; onHand: number; onOrder: number; reorderPoint: number; suggestQty: number; supplierId: string; leadTimeDays: number };

/** Items at or below their reorder point, counting stock already on order. */
export function reorderSuggestions(items: Item[], balances: Map<string, number>, orders: PurchaseOrder[]): SuggestedOrder[] {
  const onOrder = new Map<string, number>();
  for (const po of orders) {
    if (po.status !== "sent" && po.status !== "partial") continue;
    for (const l of po.lines) onOrder.set(l.sku, (onOrder.get(l.sku) ?? 0) + Math.max(0, l.qtyOrdered - l.qtyReceived));
  }
  return items
    .map((item) => {
      const stock = [...balances].reduce((s, [k, v]) => (k.startsWith(`${item.sku}|`) ? s + v : s), 0);
      const ordered = onOrder.get(item.sku) ?? 0;
      return { sku: item.sku, onHand: stock, onOrder: ordered, reorderPoint: item.reorderPoint, suggestQty: item.reorderQty, supplierId: item.supplierId, leadTimeDays: item.leadTimeDays };
    })
    .filter((r) => r.onHand + r.onOrder <= r.reorderPoint)
    .sort((a, b) => a.onHand + a.onOrder - (b.onHand + b.onOrder));
}

export function createDraft(id: string, supplierId: string, warehouse: Warehouse, items: Item[], skus: string[], at: string, expectedAt: string): PurchaseOrder {
  return {
    id,
    supplierId,
    warehouse,
    status: "draft",
    createdAt: at,
    expectedAt,
    lines: skus
      .map((sku) => items.find((i) => i.sku === sku))
      .filter((i): i is Item => Boolean(i))
      .map((i) => ({ sku: i.sku, qtyOrdered: i.reorderQty, qtyReceived: 0, unitPrice: i.unitCost })),
  };
}
