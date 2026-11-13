import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DATA_END, DATA_START, buildDataset } from "../src/data/generate.ts";
import { bucketOf, dayCount, delta, filterOrders, groupBy, previousPeriod, productPerformance, sortRows, summarise, timeSeries, toCSV } from "../src/lib/analytics.ts";
import { money, percent } from "../src/lib/format.ts";

const { products, orders } = buildDataset();
const ALL = { from: DATA_START, to: DATA_END };

describe("dataset", () => {
  it("is deterministic", () => {
    const again = buildDataset();
    assert.equal(again.orders.length, orders.length);
    assert.equal(again.orders[1000].revenue, orders[1000].revenue);
    assert.deepEqual(again.products[3], products[3]);
  });
  it("covers the stated range with valid rows", () => {
    assert.ok(orders.length > 5000, `only ${orders.length} orders`);
    assert.equal(new Set(orders.map((o) => o.date)).size, 546); // every day in the range has orders
    assert.equal(orders.filter((o) => o.date < DATA_START || o.date > DATA_END).length, 0);
    assert.equal(orders.filter((o) => o.units < 1 || o.revenue <= 0).length, 0);
    assert.equal(products.length, 24);
  });
  it("marks each customer new exactly once", () => {
    const firsts = new Map<string, number>();
    for (const o of orders) if (o.isNewCustomer) firsts.set(o.customerId, (firsts.get(o.customerId) ?? 0) + 1);
    assert.equal([...firsts.values()].every((n) => n === 1), true);
  });
});

describe("ranges", () => {
  it("counts days inclusively", () => {
    assert.equal(dayCount({ from: "2026-01-01", to: "2026-01-01" }), 1);
    assert.equal(dayCount({ from: "2026-01-01", to: "2026-01-31" }), 31);
  });
  it("puts the previous period immediately before, with the same length", () => {
    const p = previousPeriod({ from: "2026-03-01", to: "2026-03-30" });
    assert.deepEqual(p, { from: "2026-01-30", to: "2026-02-28" });
    assert.equal(dayCount(p), 30);
  });
  it("buckets dates by day, ISO week and month", () => {
    assert.equal(bucketOf("2026-03-11", "day"), "2026-03-11");
    assert.equal(bucketOf("2026-03-11", "week"), "2026-03-09"); // Wednesday → Monday
    assert.equal(bucketOf("2026-03-09", "week"), "2026-03-09");
    assert.equal(bucketOf("2026-03-08", "week"), "2026-03-02"); // Sunday belongs to the previous Monday
    assert.equal(bucketOf("2026-03-11", "month"), "2026-03-01");
  });
});

describe("aggregation", () => {
  it("totals match a manual sum over the same rows", () => {
    const m = summarise(orders, products);
    assert.equal(m.revenue, orders.reduce((s, o) => s + o.revenue, 0));
    assert.equal(m.units, orders.reduce((s, o) => s + o.units, 0));
    assert.equal(m.orders, orders.length);
    assert.equal(m.customers, new Set(orders.map((o) => o.customerId)).size);
    assert.ok(m.grossProfit > 0 && m.grossProfit < m.revenue);
  });
  it("filters by range and channel", () => {
    const q1 = filterOrders(orders, { from: "2026-01-01", to: "2026-03-31" }, []);
    assert.ok(q1.every((o) => o.date >= "2026-01-01" && o.date <= "2026-03-31"));
    const direct = filterOrders(orders, ALL, ["Direct"]);
    assert.ok(direct.every((o) => o.channel === "Direct"));
    assert.ok(direct.length < orders.length && direct.length > 0);
    const two = filterOrders(orders, ALL, ["Direct", "Wholesale"]);
    assert.equal(two.length, direct.length + filterOrders(orders, ALL, ["Wholesale"]).length);
  });
  it("keeps every bucket in range, including empty ones", () => {
    const quiet = { from: "2026-02-01", to: "2026-02-28" };
    const days = timeSeries([], quiet, "day");
    assert.equal(days.length, 28);
    assert.ok(days.every((p) => p.revenue === 0));
    const series = timeSeries(filterOrders(orders, quiet, []), quiet, "day");
    assert.equal(series.reduce((s, p) => s + p.revenue, 0), summarise(filterOrders(orders, quiet, []), products).revenue);
    assert.deepEqual([...series].sort((a, b) => a.bucket.localeCompare(b.bucket)).map((p) => p.bucket), series.map((p) => p.bucket));
  });
  it("breakdown shares add up to about 100%", () => {
    const rows = groupBy(filterOrders(orders, ALL, []), "channel");
    assert.equal(rows.length, 5);
    const total = rows.reduce((s, r) => s + r.share, 0);
    assert.ok(Math.abs(total - 100) < 0.5, `shares total ${total}`);
    assert.ok(rows[0].revenue >= rows[1].revenue);
  });
  it("computes margin and days of cover", () => {
    const rows = productPerformance(filterOrders(orders, ALL, []), products, dayCount(ALL));
    const row = rows[0];
    assert.equal(row.grossProfit <= row.revenue, true);
    assert.ok(row.margin > 0 && row.margin < 100);
    const p = products.find((x) => x.id === row.id);
    assert.ok(p && row.daysOfCover !== null && row.daysOfCover === Math.round(p.onHand / (row.units / dayCount(ALL))));
    const none = productPerformance([], products, 30);
    assert.equal(none[0].daysOfCover, null);
    assert.equal(none[0].margin, 0);
  });
});

describe("presentation helpers", () => {
  it("computes deltas and guards divide-by-zero", () => {
    assert.equal(delta(150, 100), 50);
    assert.equal(delta(75, 100), -25);
    assert.equal(delta(100, 0), null);
    assert.equal(percent(null), "—");
    assert.equal(percent(12.34), "+12.3%");
  });
  it("formats money, compact and full", () => {
    assert.equal(money(123456), "$1,234.56");
    assert.equal(money(123456789, true), "$1.2M");
    assert.equal(money(450000, true), "$4.5K");
  });
  it("sorts rows in both directions and puts nulls last", () => {
    const rows = productPerformance(filterOrders(orders, ALL, []), products, 365);
    const desc = sortRows(rows, "revenue", "desc");
    assert.ok(desc[0].revenue >= desc[1].revenue);
    const asc = sortRows(rows, "name", "asc");
    assert.ok(asc[0].name.localeCompare(asc[1].name) <= 0);
    const withNull = sortRows([...productPerformance([], products, 30)], "daysOfCover", "asc");
    assert.equal(withNull[withNull.length - 1].daysOfCover, null);
  });
  it("escapes CSV fields", () => {
    const csv = toCSV(["a", "b"], [["plain", 1], ['say "hi"', 2], ["x,y", 3]]);
    assert.equal(csv.split("\r\n")[1], "plain,1");
    assert.equal(csv.split("\r\n")[2], '"say ""hi""",2');
    assert.equal(csv.split("\r\n")[3], '"x,y",3');
  });
});
