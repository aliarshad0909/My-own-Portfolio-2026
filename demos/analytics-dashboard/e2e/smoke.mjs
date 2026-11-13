// Browser checks for the dashboard's interactive behaviour.
// Usage: node e2e/smoke.mjs http://localhost:5173
import { chromium } from "playwright";
const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");
const R = [];
const ok = (n, c, extra = "") => R.push(`${c ? "PASS" : "FAIL"}  ${n}${extra ? `  [${extra}]` : ""}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(base);
await p.waitForTimeout(400);

const kpi = async (label) => (await p.locator(".kpi", { hasText: label }).first().locator(".kpi__value").innerText()).trim();
const rows = () => p.locator(".table tbody tr").count();

// Date range changes the numbers
const rev90 = await kpi("Revenue");
await p.locator('[aria-labelledby="range-label"]').getByRole("button", { name: "30 days" }).click();
await p.waitForTimeout(250);
const rev30 = await kpi("Revenue");
ok("switching 90d → 30d changes revenue", rev90 !== rev30, `${rev90} → ${rev30}`);
await p.locator('[aria-labelledby="range-label"]').getByRole("button", { name: "All time" }).click();
await p.waitForTimeout(300);
const revAll = await kpi("Revenue");
const num = (s) => Number(s.replace(/[^0-9.]/g, "")) * (s.includes("M") ? 1e6 : s.includes("K") ? 1e3 : 1);
ok("all-time revenue is the largest", num(revAll) > num(rev90) && num(rev90) > num(rev30), `${rev30} / ${rev90} / ${revAll}`);

// Granularity changes the number of plotted points
await p.locator('[aria-labelledby="range-label"]').getByRole("button", { name: "90 days" }).click();
await p.waitForTimeout(250);
const pts = async () => (await p.locator("figure.chart table tbody tr").count());
await p.locator('[aria-label="Granularity"]').getByRole("button", { name: "Day", exact: true }).click();
await p.waitForTimeout(200);
const d = await pts();
await p.locator('[aria-label="Granularity"]').getByRole("button", { name: "Week", exact: true }).click();
await p.waitForTimeout(200);
const w = await pts();
await p.locator('[aria-label="Granularity"]').getByRole("button", { name: "Month", exact: true }).click();
await p.waitForTimeout(200);
const m = await pts();
ok("granularity day > week > month buckets", d === 90 && w > m && w < d, `${d}/${w}/${m}`);

// Chart hover reads out exact values
await p.locator('[aria-label="Granularity"]').getByRole("button", { name: "Week", exact: true }).click();
await p.waitForTimeout(200);
const box = await p.locator(".chart__svg").boundingBox();
await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
await p.waitForTimeout(200);
ok("hovering the chart shows a readout", /\$[\d,]+/.test(await p.locator(".chart__readout").innerText()));

// Channel filter
const before = await kpi("Orders");
await p.locator('[aria-labelledby="ch-label"]').getByRole("button", { name: "Wholesale", exact: true }).click();
await p.waitForTimeout(250);
const after = await kpi("Orders");
const bars = await p.locator(".bars li").count();
ok("channel filter reduces orders and the channel breakdown", Number(after.replace(/\D/g, "")) < Number(before.replace(/\D/g, "")) && bars === 1 + 6, `${before} → ${after}, ${bars} bars`);
await p.locator('[aria-labelledby="ch-label"]').getByRole("button", { name: "Clear" }).click();
await p.waitForTimeout(200);
ok("clearing restores all orders", (await kpi("Orders")) === before);

// Period-on-period deltas exist and are signed
const deltas = await p.locator(".kpi__delta").allInnerTexts();
ok("every KPI shows a period-on-period delta", deltas.length === 6 && deltas.every((t) => /[+-]\d|—/.test(t)));

// Sorting
await p.locator(".table thead button", { hasText: "Units" }).click();
await p.waitForTimeout(200);
const first = await p.locator(".table tbody tr").first().locator("td").first().innerText();
await p.locator(".table thead button", { hasText: "Units" }).click();
await p.waitForTimeout(200);
const firstAsc = await p.locator(".table tbody tr").first().locator("td").first().innerText();
ok("sorting by units toggles direction", Number(first.replace(/\D/g, "")) > Number(firstAsc.replace(/\D/g, "")), `${first} vs ${firstAsc}`);
ok("aria-sort is set on the active column", (await p.locator('.table thead th[aria-sort="ascending"]').count()) === 1);
ok("all 24 products are listed", (await rows()) === 24);

// Custom range
await p.locator('[aria-labelledby="range-label"]').getByRole("button", { name: "Custom" }).click();
await p.waitForTimeout(200);
await p.locator('input[type="date"]').first().fill("2026-01-01");
await p.locator('input[type="date"]').nth(1).fill("2026-01-31");
await p.waitForTimeout(300);
ok("custom range is applied", (await p.locator(".top__meta").innerText()).includes("31 days"), await p.locator(".top__meta").innerText());

// CSV export really produces a file
const dl = p.waitForEvent("download", { timeout: 5000 });
await p.getByRole("button", { name: "Export CSV" }).click();
const file = await dl;
const stream = await file.createReadStream();
let csv = "";
for await (const c of stream) csv += c;
const lines = csv.trim().split("\r\n");
ok("CSV export downloads with a header and 24 rows", lines.length === 25 && lines[0].startsWith("Product,Category,Units"), `${lines.length} lines, name=${file.suggestedFilename()}`);

// Screen-reader alternatives for every chart
ok("charts have table alternatives", (await p.locator("figure.chart table, .bars table").count()) === 3);
ok("no runtime errors", errs.length === 0, errs.slice(0, 2).join(" | "));

await b.close();
console.log(R.join("\n"));
const failed = R.filter((r) => r.startsWith("FAIL")).length;
console.log(`${R.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
