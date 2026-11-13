import { post, resetSequence } from "../lib/ledger.ts";
import type { Item, Movement, PurchaseOrder, Supplier, Warehouse } from "../lib/types.ts";

/** Deterministic synthetic data for a fictional furniture maker, Meridian Works. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-01", name: "Ardent Timber Co.", country: "Canada", contact: "orders@ardent.example", terms: 30, onTimeRate: 0.94 },
  { id: "SUP-02", name: "Bowden Metalworks", country: "United Kingdom", contact: "sales@bowden.example", terms: 45, onTimeRate: 0.88 },
  { id: "SUP-03", name: "Caldera Textiles", country: "Portugal", contact: "hello@caldera.example", terms: 30, onTimeRate: 0.72 },
  { id: "SUP-04", name: "Dongguan Fittings Ltd", country: "China", contact: "export@dgfittings.example", terms: 60, onTimeRate: 0.81 },
  { id: "SUP-05", name: "Elmgrove Finishes", country: "United States", contact: "team@elmgrove.example", terms: 15, onTimeRate: 0.97 },
];

const CATALOGUE: [sku: string, name: string, category: string, uom: string, cost: number, rop: number, roq: number, sup: string, lead: number][] = [
  ["TMB-OAK-25", "Oak board 25mm", "Timber", "sheet", 4200, 40, 120, "SUP-01", 21],
  ["TMB-WAL-19", "Walnut board 19mm", "Timber", "sheet", 6800, 25, 80, "SUP-01", 28],
  ["TMB-PLY-18", "Birch ply 18mm", "Timber", "sheet", 2900, 60, 200, "SUP-01", 14],
  ["MET-LEG-40", "Steel leg 400mm", "Metal", "each", 850, 200, 600, "SUP-02", 18],
  ["MET-BRK-S", "Shelf bracket small", "Metal", "each", 320, 400, 1200, "SUP-02", 18],
  ["MET-ROD-12", "Steel rod 12mm", "Metal", "metre", 540, 120, 400, "SUP-02", 25],
  ["TEX-LIN-NAT", "Linen weave, natural", "Textile", "metre", 1750, 80, 250, "SUP-03", 35],
  ["TEX-WOL-GRY", "Wool blend, grey", "Textile", "metre", 2400, 60, 180, "SUP-03", 35],
  ["FIT-HNG-SS", "Soft-close hinge", "Fittings", "each", 290, 500, 2000, "SUP-04", 45],
  ["FIT-SLD-450", "Drawer slide 450mm", "Fittings", "pair", 760, 150, 500, "SUP-04", 45],
  ["FIT-KNB-BRS", "Brass knob", "Fittings", "each", 420, 300, 1000, "SUP-04", 40],
  ["FIN-OIL-5L", "Hardwax oil 5L", "Finishes", "tin", 5600, 20, 60, "SUP-05", 10],
  ["FIN-LAQ-5L", "Matt lacquer 5L", "Finishes", "tin", 4900, 18, 50, "SUP-05", 10],
  ["FIN-GLU-1L", "Wood glue 1L", "Finishes", "bottle", 1200, 40, 120, "SUP-05", 7],
  ["PKG-BOX-L", "Carton, large", "Packaging", "each", 180, 600, 2000, "SUP-04", 30],
  ["PKG-WRP-100", "Protective wrap 100m", "Packaging", "roll", 2200, 25, 80, "SUP-04", 30],
];

export const ITEMS: Item[] = CATALOGUE.map(([sku, name, category, uom, unitCost, reorderPoint, reorderQty, supplierId, leadTimeDays]) => ({
  sku, name, category, uom, unitCost, reorderPoint, reorderQty, supplierId, leadTimeDays,
}));

export const TODAY = "2026-06-30";
const WAREHOUSES: Warehouse[] = ["MAIN", "WEST"];

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Six months of receipts, production issues and the odd count adjustment. */
export function seed(): { movements: Movement[]; orders: PurchaseOrder[] } {
  resetSequence(0);
  const rand = rng(260630);
  let movements: Movement[] = [];

  // Opening balances.
  for (const item of ITEMS) {
    for (const wh of WAREHOUSES) {
      const qty = wh === "MAIN" ? item.reorderPoint * 3 + Math.floor(rand() * item.reorderQty) : Math.floor(item.reorderPoint * (0.4 + rand()));
      const r = post(movements, { at: `${addDays(TODAY, -180)}T08:00:00Z`, sku: item.sku, warehouse: wh, type: "adjustment", qty, reference: "OPENING", note: "Opening balance" });
      if (r.ok) movements = r.movements;
    }
  }

  // Daily production draw-down, with receipts when stock gets low.
  for (let day = 179; day >= 0; day--) {
    const date = addDays(TODAY, -day);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) continue;

    for (const item of ITEMS) {
      if (rand() > 0.55) continue;
      const draw = 1 + Math.floor(rand() * Math.max(2, item.reorderQty / 12));
      const r = post(movements, { at: `${date}T10:00:00Z`, sku: item.sku, warehouse: "MAIN", type: "issue", qty: -draw, reference: `WO-${date.replace(/-/g, "")}`, note: "Production issue" });
      if (r.ok) movements = r.movements;
    }

    if (day % 14 === 0) {
      for (const item of ITEMS) {
        if (rand() > 0.5) continue;
        const r = post(movements, { at: `${date}T14:00:00Z`, sku: item.sku, warehouse: "MAIN", type: "receipt", qty: item.reorderQty, reference: `PO-H${day}`, note: "Historic receipt" });
        if (r.ok) movements = r.movements;
      }
    }

    if (day % 45 === 0) {
      const item = ITEMS[Math.floor(rand() * ITEMS.length)];
      const delta = rand() > 0.5 ? -Math.ceil(rand() * 4) : Math.ceil(rand() * 3);
      const r = post(movements, { at: `${date}T16:00:00Z`, sku: item.sku, warehouse: "MAIN", type: "adjustment", qty: delta, reference: "CYCLE-COUNT", note: delta < 0 ? "Cycle count: shrinkage" : "Cycle count: found stock" });
      if (r.ok) movements = r.movements;
    }
  }

  const orders: PurchaseOrder[] = [
    {
      id: "PO-2026-041", supplierId: "SUP-01", warehouse: "MAIN", status: "sent", createdAt: addDays(TODAY, -12), expectedAt: addDays(TODAY, 9),
      lines: [
        { sku: "TMB-OAK-25", qtyOrdered: 120, qtyReceived: 0, unitPrice: 4150 },
        { sku: "TMB-PLY-18", qtyOrdered: 200, qtyReceived: 0, unitPrice: 2850 },
      ],
    },
    {
      id: "PO-2026-042", supplierId: "SUP-04", warehouse: "MAIN", status: "partial", createdAt: addDays(TODAY, -40), expectedAt: addDays(TODAY, -2),
      lines: [
        { sku: "FIT-HNG-SS", qtyOrdered: 2000, qtyReceived: 1200, unitPrice: 285 },
        { sku: "FIT-SLD-450", qtyOrdered: 500, qtyReceived: 500, unitPrice: 745 },
        { sku: "PKG-BOX-L", qtyOrdered: 2000, qtyReceived: 0, unitPrice: 175 },
      ],
    },
    {
      id: "PO-2026-043", supplierId: "SUP-05", warehouse: "MAIN", status: "draft", createdAt: addDays(TODAY, -1), expectedAt: addDays(TODAY, 10),
      lines: [{ sku: "FIN-OIL-5L", qtyOrdered: 60, qtyReceived: 0, unitPrice: 5600 }],
    },
    {
      id: "PO-2026-039", supplierId: "SUP-03", warehouse: "WEST", status: "received", createdAt: addDays(TODAY, -70), expectedAt: addDays(TODAY, -35),
      lines: [{ sku: "TEX-LIN-NAT", qtyOrdered: 250, qtyReceived: 250, unitPrice: 1720 }],
    },
  ];

  // The historic part-receipts on PO-2026-042 and PO-2026-039 must exist in the
  // ledger too, or the ledger and the orders would disagree.
  for (const po of orders) {
    for (const line of po.lines) {
      if (line.qtyReceived === 0) continue;
      const r = post(movements, { at: `${addDays(TODAY, -20)}T11:00:00Z`, sku: line.sku, warehouse: po.warehouse, type: "receipt", qty: line.qtyReceived, reference: po.id, note: "Goods receipt" });
      if (r.ok) movements = r.movements;
    }
  }

  return { movements, orders };
}
