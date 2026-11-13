import type { Item, Movement, MovementType, Warehouse } from "./types.ts";

/** Stock on hand for one SKU in one warehouse: the sum of its movements. */
export function onHand(movements: Movement[], sku: string, warehouse?: Warehouse): number {
  return movements.reduce((sum, m) => (m.sku === sku && (!warehouse || m.warehouse === warehouse) ? sum + m.qty : sum), 0);
}

/** Balances for every SKU and warehouse in one pass. */
export function balances(movements: Movement[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of movements) {
    const key = `${m.sku}|${m.warehouse}`;
    map.set(key, (map.get(key) ?? 0) + m.qty);
  }
  return map;
}

export const balanceOf = (map: Map<string, number>, sku: string, warehouse: Warehouse) => map.get(`${sku}|${warehouse}`) ?? 0;

/** Total across warehouses. */
export function totalOnHand(movements: Movement[], sku: string): number {
  return onHand(movements, sku);
}

export type PostResult = { ok: true; movements: Movement[] } | { ok: false; error: string };

let sequence = 0;
export const resetSequence = (n = 0) => { sequence = n; };

const nextId = (at: string) => `mv-${at.slice(0, 10).replace(/-/g, "")}-${String(++sequence).padStart(5, "0")}`;

/**
 * Append a movement.
 *
 * Refuses anything that would drive stock negative — you cannot ship or write
 * off what you do not have. This is the single gate every stock change passes
 * through, so no screen can bypass it.
 */
export function post(movements: Movement[], entry: Omit<Movement, "id">): PostResult {
  if (!Number.isInteger(entry.qty) || entry.qty === 0) return { ok: false, error: "Quantity must be a whole number other than zero." };
  if (entry.reference.trim() === "") return { ok: false, error: "Every movement needs a reference." };

  const current = onHand(movements, entry.sku, entry.warehouse);
  if (current + entry.qty < 0) {
    return { ok: false, error: `Only ${current} in ${entry.warehouse}; that movement would leave ${current + entry.qty}.` };
  }
  const SIGN: Record<MovementType, 1 | -1 | 0> = { receipt: 1, transfer_in: 1, issue: -1, transfer_out: -1, adjustment: 0 };
  const expected = SIGN[entry.type];
  if (expected === 1 && entry.qty < 0) return { ok: false, error: "A receipt must be positive." };
  if (expected === -1 && entry.qty > 0) return { ok: false, error: "An issue must be negative." };

  return { ok: true, movements: [...movements, { ...entry, id: nextId(entry.at) }] };
}

/** Move stock between warehouses as a matched pair, so nothing is created or lost. */
export function transfer(movements: Movement[], sku: string, from: Warehouse, to: Warehouse, qty: number, at: string, reference: string): PostResult {
  if (from === to) return { ok: false, error: "Choose two different warehouses." };
  if (qty <= 0) return { ok: false, error: "Transfer quantity must be positive." };
  const out = post(movements, { at, sku, warehouse: from, type: "transfer_out", qty: -qty, reference, note: `to ${to}` });
  if (!out.ok) return out;
  return post(out.movements, { at, sku, warehouse: to, type: "transfer_in", qty, reference, note: `from ${from}` });
}

export type LedgerRow = Movement & { balanceAfter: number };

/** Running balance per SKU and warehouse, oldest first. */
export function withRunningBalance(movements: Movement[]): LedgerRow[] {
  const running = new Map<string, number>();
  return [...movements]
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    .map((m) => {
      const key = `${m.sku}|${m.warehouse}`;
      const next = (running.get(key) ?? 0) + m.qty;
      running.set(key, next);
      return { ...m, balanceAfter: next };
    });
}

/** Inventory value at standard cost. */
export function valuation(movements: Movement[], items: Item[]): { total: number; byCategory: Map<string, number> } {
  const bal = balances(movements);
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const item of items) {
    const qty = [...bal].reduce((s, [k, v]) => (k.startsWith(`${item.sku}|`) ? s + v : s), 0);
    const value = qty * item.unitCost;
    total += value;
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + value);
  }
  return { total, byCategory };
}
