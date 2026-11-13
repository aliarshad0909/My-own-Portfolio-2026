import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ITEMS, SUPPLIERS, TODAY, seed } from "../src/data/seed.ts";
import { balanceOf, balances, onHand, post, resetSequence, totalOnHand, transfer, valuation, withRunningBalance } from "../src/lib/ledger.ts";
import { ALLOWED, canTransition, createDraft, deriveStatus, poOutstanding, poValue, receive, reorderSuggestions } from "../src/lib/purchasing.ts";
import { abcAnalysis, consumptionRate, movementSummary, stockReport, supplierReport } from "../src/lib/reports.ts";
import type { Movement, PurchaseOrder } from "../src/lib/types.ts";

const { movements, orders } = seed();
const base: Movement[] = [{ id: "m1", at: "2026-01-01T00:00:00Z", sku: "X", warehouse: "MAIN", type: "adjustment", qty: 100, reference: "OPENING" }];

describe("stock ledger", () => {
  it("derives on-hand as the sum of movements", () => {
    const ledger: Movement[] = [
      ...base,
      { id: "m2", at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "issue", qty: -30, reference: "WO-1" },
      { id: "m3", at: "2026-01-03T00:00:00Z", sku: "X", warehouse: "MAIN", type: "receipt", qty: 50, reference: "PO-1" },
    ];
    assert.equal(onHand(ledger, "X", "MAIN"), 120);
    assert.equal(onHand(ledger, "X", "WEST"), 0);
    assert.equal(totalOnHand(ledger, "X"), 120);
  });

  it("refuses a movement that would drive stock negative", () => {
    const r = post(base, { at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "issue", qty: -150, reference: "WO-2" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /Only 100 in MAIN/);
  });

  it("refuses zero, fractional and unreferenced movements", () => {
    for (const bad of [
      { qty: 0, reference: "R" },
      { qty: 1.5, reference: "R" },
      { qty: 5, reference: "  " },
    ]) {
      const r = post(base, { at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "receipt", qty: bad.qty, reference: bad.reference });
      assert.equal(r.ok, false, JSON.stringify(bad));
    }
  });

  it("enforces the sign that matches the movement type", () => {
    assert.equal(post(base, { at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "receipt", qty: -5, reference: "R" }).ok, false);
    assert.equal(post(base, { at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "issue", qty: 5, reference: "R" }).ok, false);
    // An adjustment may go either way.
    assert.equal(post(base, { at: "2026-01-02T00:00:00Z", sku: "X", warehouse: "MAIN", type: "adjustment", qty: -5, reference: "COUNT" }).ok, true);
  });

  it("never loses or creates stock on a transfer", () => {
    const r = transfer(base, "X", "MAIN", "WEST", 40, "2026-01-04T00:00:00Z", "TR-1");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(onHand(r.movements, "X", "MAIN"), 60);
    assert.equal(onHand(r.movements, "X", "WEST"), 40);
    assert.equal(totalOnHand(r.movements, "X"), 100, "total must be unchanged");
    assert.equal(r.movements.length, base.length + 2, "a transfer is a matched pair");
  });

  it("refuses a transfer to the same warehouse, a negative quantity, or more than is held", () => {
    assert.equal(transfer(base, "X", "MAIN", "MAIN", 10, "2026-01-04T00:00:00Z", "TR").ok, false);
    assert.equal(transfer(base, "X", "MAIN", "WEST", -10, "2026-01-04T00:00:00Z", "TR").ok, false);
    assert.equal(transfer(base, "X", "MAIN", "WEST", 500, "2026-01-04T00:00:00Z", "TR").ok, false);
  });

  it("gives every movement a unique id", () => {
    resetSequence(0);
    let ledger = base;
    for (let i = 0; i < 50; i++) {
      const r = post(ledger, { at: "2026-02-01T00:00:00Z", sku: "X", warehouse: "MAIN", type: "receipt", qty: 1, reference: "R" });
      if (r.ok) ledger = r.movements;
    }
    assert.equal(new Set(ledger.map((m) => m.id)).size, ledger.length);
  });

  it("runs a correct balance per SKU and warehouse", () => {
    const r1 = transfer(base, "X", "MAIN", "WEST", 10, "2026-01-05T00:00:00Z", "TR-2");
    assert.equal(r1.ok, true);
    if (!r1.ok) return;
    const rows = withRunningBalance(r1.movements);
    assert.deepEqual(rows.map((r) => `${r.warehouse}:${r.balanceAfter}`), ["MAIN:100", "MAIN:90", "WEST:10"]);
  });
});

describe("seeded dataset", () => {
  it("is deterministic and internally consistent", () => {
    const again = seed();
    assert.equal(again.movements.length, movements.length);
    assert.equal(again.movements[500].id, movements[500].id);
    assert.ok(movements.length > 1000, `${movements.length} movements`);
    assert.ok(movements.some((m) => m.at.startsWith("2026-01")) && movements.some((m) => m.at.startsWith("2026-06")), "should span six months");
  });

  it("never holds negative stock anywhere", () => {
    for (const [key, qty] of balances(movements)) assert.ok(qty >= 0, `${key} is ${qty}`);
  });

  it("matches every received PO line to receipt movements in the ledger", () => {
    for (const po of orders) {
      for (const line of po.lines) {
        if (line.qtyReceived === 0) continue;
        const booked = movements
          .filter((m) => m.reference === po.id && m.sku === line.sku && m.type === "receipt")
          .reduce((s, m) => s + m.qty, 0);
        assert.equal(booked, line.qtyReceived, `${po.id} ${line.sku}: ledger ${booked} vs PO ${line.qtyReceived}`);
      }
    }
  });

  it("values the inventory at standard cost", () => {
    const v = valuation(movements, ITEMS);
    const manual = ITEMS.reduce((s, i) => s + totalOnHand(movements, i.sku) * i.unitCost, 0);
    assert.equal(v.total, manual);
    assert.ok(v.total > 0);
    assert.equal([...v.byCategory.values()].reduce((a, b) => a + b, 0), v.total);
  });
});

describe("purchase orders", () => {
  const po = (): PurchaseOrder => ({
    id: "PO-T1", supplierId: "SUP-01", warehouse: "MAIN", status: "sent", createdAt: "2026-06-01", expectedAt: "2026-06-20",
    lines: [
      { sku: "TMB-OAK-25", qtyOrdered: 100, qtyReceived: 0, unitPrice: 4000 },
      { sku: "TMB-PLY-18", qtyOrdered: 50, qtyReceived: 0, unitPrice: 2800 },
    ],
  });

  it("computes value and outstanding quantity", () => {
    assert.equal(poValue(po()), 100 * 4000 + 50 * 2800);
    assert.equal(poOutstanding(po()), 150);
  });

  it("receives part of an order and marks it partial", () => {
    const r = receive(po(), movements, [{ sku: "TMB-OAK-25", qty: 40 }], "2026-06-21T09:00:00Z");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.po.status, "partial");
    assert.equal(r.po.lines[0].qtyReceived, 40);
    assert.equal(poOutstanding(r.po), 110);
    const added = r.movements.length - movements.length;
    assert.equal(added, 1, "one receipt movement per line received");
    assert.equal(balanceOf(balances(r.movements), "TMB-OAK-25", "MAIN"), balanceOf(balances(movements), "TMB-OAK-25", "MAIN") + 40);
  });

  it("marks the order received once every line is complete", () => {
    const first = receive(po(), movements, [{ sku: "TMB-OAK-25", qty: 100 }], "2026-06-21T09:00:00Z");
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const second = receive(first.po, first.movements, [{ sku: "TMB-PLY-18", qty: 50 }], "2026-06-22T09:00:00Z");
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.po.status, "received");
    assert.equal(poOutstanding(second.po), 0);
  });

  it("refuses to receive more than was ordered", () => {
    const r = receive(po(), movements, [{ sku: "TMB-OAK-25", qty: 101 }], "2026-06-21T09:00:00Z");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /100 still outstanding/);
  });

  it("refuses a SKU that is not on the order, a draft, a cancelled order and an empty receipt", () => {
    assert.equal(receive(po(), movements, [{ sku: "FIN-OIL-5L", qty: 1 }], "2026-06-21T09:00:00Z").ok, false);
    assert.equal(receive({ ...po(), status: "draft" }, movements, [{ sku: "TMB-OAK-25", qty: 1 }], "2026-06-21T09:00:00Z").ok, false);
    assert.equal(receive({ ...po(), status: "cancelled" }, movements, [{ sku: "TMB-OAK-25", qty: 1 }], "2026-06-21T09:00:00Z").ok, false);
    assert.equal(receive(po(), movements, [], "2026-06-21T09:00:00Z").ok, false);
    assert.equal(receive(po(), movements, [{ sku: "TMB-OAK-25", qty: 2.5 }], "2026-06-21T09:00:00Z").ok, false);
  });

  it("leaves the ledger untouched when a receipt is refused", () => {
    const before = movements.length;
    receive(po(), movements, [{ sku: "TMB-OAK-25", qty: 999 }], "2026-06-21T09:00:00Z");
    assert.equal(movements.length, before);
  });

  it("derives status rather than trusting it", () => {
    assert.equal(deriveStatus({ ...po(), status: "sent" }), "sent");
    assert.equal(deriveStatus({ ...po(), lines: [{ sku: "A", qtyOrdered: 10, qtyReceived: 4, unitPrice: 1 }] }), "partial");
    assert.equal(deriveStatus({ ...po(), lines: [{ sku: "A", qtyOrdered: 10, qtyReceived: 10, unitPrice: 1 }] }), "received");
    assert.equal(deriveStatus({ ...po(), status: "draft" }), "draft", "a draft stays a draft");
    assert.equal(deriveStatus({ ...po(), status: "cancelled" }), "cancelled");
  });

  it("allows only sensible status transitions", () => {
    assert.equal(canTransition("draft", "sent"), true);
    assert.equal(canTransition("draft", "received"), false);
    assert.equal(canTransition("received", "cancelled"), false);
    assert.deepEqual(ALLOWED.received, []);
  });

  it("creates a draft from reorder defaults", () => {
    const d = createDraft("PO-NEW", "SUP-05", "MAIN", ITEMS, ["FIN-OIL-5L", "nope"], "2026-06-30", "2026-07-10");
    assert.equal(d.status, "draft");
    assert.equal(d.lines.length, 1, "unknown SKUs are dropped");
    assert.equal(d.lines[0].qtyOrdered, ITEMS.find((i) => i.sku === "FIN-OIL-5L")?.reorderQty);
  });
});

describe("reordering", () => {
  it("suggests only items at or below their reorder point", () => {
    const rows = reorderSuggestions(ITEMS, balances(movements), orders);
    for (const r of rows) assert.ok(r.onHand + r.onOrder <= r.reorderPoint, `${r.sku}: ${r.onHand}+${r.onOrder} > ${r.reorderPoint}`);
  });

  it("counts stock already on order so nothing is ordered twice", () => {
    const item = ITEMS[0];
    const bal = new Map([[`${item.sku}|MAIN`, 0]]);
    assert.equal(reorderSuggestions([item], bal, []).length, 1, "no cover, should suggest");
    const covered: PurchaseOrder[] = [{ id: "PO-X", supplierId: item.supplierId, warehouse: "MAIN", status: "sent", createdAt: "x", expectedAt: "y", lines: [{ sku: item.sku, qtyOrdered: item.reorderPoint + 1, qtyReceived: 0, unitPrice: 1 }] }];
    assert.equal(reorderSuggestions([item], bal, covered).length, 0, "already on order, should not suggest");
  });

  it("ignores draft and cancelled orders as cover", () => {
    const item = ITEMS[0];
    const bal = new Map([[`${item.sku}|MAIN`, 0]]);
    const draft: PurchaseOrder[] = [{ id: "PO-D", supplierId: item.supplierId, warehouse: "MAIN", status: "draft", createdAt: "x", expectedAt: "y", lines: [{ sku: item.sku, qtyOrdered: 9999, qtyReceived: 0, unitPrice: 1 }] }];
    assert.equal(reorderSuggestions([item], bal, draft).length, 1, "a draft is not cover");
  });
});

describe("reports", () => {
  const rows = stockReport(ITEMS, movements, TODAY, orders);

  it("distinguishes below-reorder from needing an order", () => {
    const covered = rows.filter((r) => r.belowReorder && !r.needsOrder);
    for (const r of covered) assert.ok(r.onOrder > 0, `${r.item.sku} is covered but shows no open order`);
    for (const r of rows.filter((r) => r.needsOrder)) assert.ok(r.total + r.onOrder <= r.item.reorderPoint);
    assert.deepEqual(
      rows.filter((r) => r.needsOrder).map((r) => r.item.sku).sort(),
      reorderSuggestions(ITEMS, balances(movements), orders).map((s) => s.sku).sort(),
      "the table and the suggestions must agree",
    );
  });

  it("reports one row per item with warehouse split adding to the total", () => {
    assert.equal(rows.length, ITEMS.length);
    for (const r of rows) assert.equal(r.main + r.west, r.total);
  });

  it("computes days of cover from real issue history", () => {
    const moving = rows.filter((r) => r.perDay > 0);
    assert.ok(moving.length > 5, "most items should have consumption");
    for (const r of moving) assert.equal(r.daysCover, Math.round(r.total / r.perDay));
    const idle = stockReport(ITEMS, movements.filter((m) => m.type !== "issue"), TODAY, orders);
    assert.equal(idle[0].daysCover, null, "no consumption means no cover figure, not zero");
  });

  it("classifies ABC so that A items are the smaller, more valuable group", () => {
    const abc = abcAnalysis(rows);
    assert.equal(abc.size, ITEMS.length);
    const counts = { A: 0, B: 0, C: 0 };
    for (const band of abc.values()) counts[band]++;
    assert.ok(counts.A > 0 && counts.A <= counts.A + counts.B + counts.C);
    assert.ok(counts.A < ITEMS.length, "not everything can be an A item");
  });

  it("summarises supplier exposure and flags overdue orders", () => {
    const sup = supplierReport(SUPPLIERS, ITEMS, orders, TODAY);
    assert.equal(sup.length, SUPPLIERS.length);
    const dg = sup.find((s) => s.supplier.id === "SUP-04");
    assert.equal(dg?.openOrders, 1);
    assert.equal(dg?.overdue, 1, "PO-2026-042 was expected two days ago");
    assert.ok((dg?.openValue ?? 0) > 0);
    const received = sup.find((s) => s.supplier.id === "SUP-03");
    assert.equal(received?.openOrders, 0, "a fully received order is not open");
  });

  it("summarises movements over a window", () => {
    const s = movementSummary(movements, 30, TODAY);
    assert.ok(s.total > 0);
    assert.ok(s.issues > 0);
    assert.equal(s.total, movements.filter((m) => m.at >= "2026-05-31T00:00:00Z").length);
  });

  it("measures consumption only within the window", () => {
    const all = consumptionRate(movements, "TMB-OAK-25", 365, TODAY);
    const recent = consumptionRate(movements, "TMB-OAK-25", 7, TODAY);
    assert.ok(all > 0 && recent >= 0);
    assert.equal(consumptionRate(movements, "TMB-OAK-25", 0, TODAY), 0);
  });
});
