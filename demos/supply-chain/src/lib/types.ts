export type Warehouse = "MAIN" | "WEST";

export type Item = {
  sku: string;
  name: string;
  category: string;
  uom: string;
  /** Standard cost in cents, used for valuation. */
  unitCost: number;
  reorderPoint: number;
  reorderQty: number;
  supplierId: string;
  leadTimeDays: number;
};

export type Supplier = {
  id: string;
  name: string;
  country: string;
  contact: string;
  /** Payment terms in days. */
  terms: number;
  /** Share of past POs delivered on time, 0–1. */
  onTimeRate: number;
};

/**
 * Every stock change is a movement. On-hand is never stored — it is the sum of
 * movements for a SKU and warehouse, so the ledger and the balance can never
 * disagree.
 */
export type MovementType = "receipt" | "issue" | "adjustment" | "transfer_in" | "transfer_out";

export type Movement = {
  id: string;
  at: string;
  sku: string;
  warehouse: Warehouse;
  type: MovementType;
  /** Signed: positive adds stock, negative removes it. */
  qty: number;
  /** Where this came from — a PO number, a works order, an adjustment reason. */
  reference: string;
  note?: string;
};

export type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

export type POLine = {
  sku: string;
  qtyOrdered: number;
  qtyReceived: number;
  /** Agreed unit price in cents, which may differ from standard cost. */
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  warehouse: Warehouse;
  status: POStatus;
  createdAt: string;
  expectedAt: string;
  lines: POLine[];
};

export const ADJUSTMENT_REASONS = ["Cycle count", "Damage", "Shrinkage", "Found stock", "Return to supplier", "Customer return"] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];
